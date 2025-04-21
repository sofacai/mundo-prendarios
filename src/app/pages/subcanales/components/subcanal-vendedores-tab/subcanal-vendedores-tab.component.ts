import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { UsuarioDto, UsuarioService } from 'src/app/core/services/usuario.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { RolType } from 'src/app/core/models/usuario.model';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UsuarioFormComponent } from 'src/app/shared/modals/usuario-form/usuario-form.component';

@Component({
  selector: 'app-subcanal-vendedores-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, UsuarioFormComponent],
  templateUrl: './subcanal-vendedores-tab.component.html',
  styleUrls: ['./subcanal-vendedores-tab.component.scss']
})
export class SubcanalVendedoresTabComponent implements OnInit {
  @Input() subcanal!: Subcanal;
  @Input() loadingVendedores: Map<number, boolean> = new Map();
  @Input() availableVendors: UsuarioDto[] = [];

  @Output() asignarVendedor = new EventEmitter<void>();
  @Output() asignarVendedorConfirmado = new EventEmitter<number>();
  @Output() toggleVendorEstado = new EventEmitter<{ vendorId: number, estadoActual: boolean }>();
  @Output() desasignarVendor = new EventEmitter<number>();
  @Output() verDetalleVendor = new EventEmitter<number>();
  @Output() crearVendedor = new EventEmitter<void>();

  // Modal state
  showModal = false;
  selectedVendorId: string | number = '';
  isLoading = false;
  errorMessage: string | null = null;
  assigning = false;

  // Modal de creación de vendedor
  showCrearVendedorModal = false;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (!this.subcanal.vendors) {
      this.subcanal.vendors = [];
    }
  }

  @Input() getVendorOperaciones!: (vendorId: number) => number;
  @Input() getVendorClientes!: (vendorId: number) => number;
  @Input() getVendorOperacionesLiquidadas!: (vendorId: number) => number;

  isVendorLoading(vendorId: number): boolean {
    return this.loadingVendedores.get(vendorId) === true;
  }

  onToggleVendorEstado(vendorId: number, estadoActual: boolean): void {
    this.toggleVendorEstado.emit({ vendorId, estadoActual });
  }

  onDesasignarVendor(vendorId: number): void {
    this.desasignarVendor.emit(vendorId);
  }

  onVerDetalleVendor(vendorId: number): void {
    this.verDetalleVendor.emit(vendorId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  openModal(): void {
    this.showModal = true;
    this.selectedVendorId = '';
    this.errorMessage = null;
    this.isLoading = true;

    this.asignarVendedor.emit();
  }

  updateLoadingState(loading: boolean): void {
    this.isLoading = loading;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedVendorId = '';
    this.errorMessage = null;
  }

  updateAvailableVendors(vendors: UsuarioDto[]): void {
    this.availableVendors = vendors;
    this.isLoading = false;
  }

  loadDisponibleVendors(): void {
    this.isLoading = true;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.isLoading = false;
      return;
    }

    // Combinar vendedores asignados + creados por el usuario actual
    forkJoin({
      asignados: this.usuarioService.getUsuariosPorRol(RolType.Vendor).pipe(catchError(() => of([]))),
      creados: this.usuarioService.getUsuariosPorCreador(currentUser.id).pipe(
        map(usuarios => usuarios.filter(u => u.rolId === RolType.Vendor)),
        catchError(() => of([]))
      )
    }).pipe(
      map(result => {
        const { asignados, creados } = result;

        // Combinar ambas listas y eliminar duplicados
        const todosVendores = [...asignados, ...creados];
        const vendoresUnicos = todosVendores.filter((vendor, index, self) =>
          index === self.findIndex((v) => v.id === vendor.id)
        );

        // Filtrar los que ya están asignados al subcanal
        return vendoresUnicos.filter(vendor =>
          !this.subcanal.vendors?.some(v => v.id === vendor.id)
        );
      })
    ).subscribe({
      next: (vendors) => {
        this.availableVendors = vendors;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = "Error al cargar los vendedores disponibles";
      }
    });
  }

  confirmarAsignacion(): void {
    if (this.selectedVendorId && !this.assigning) {
      this.assigning = true;
      this.errorMessage = null;
      this.asignarVendedorConfirmado.emit(Number(this.selectedVendorId));
    }
  }

  finalizarAsignacion(exito: boolean, mensaje?: string): void {
    this.assigning = false;

    if (!exito && mensaje) {
      this.errorMessage = mensaje;
    } else {
      this.closeModal();
    }
  }


  // Nuevos métodos para la creación de vendedores
  crearNuevoVendedor(): void {
    this.showCrearVendedorModal = true;
    this.crearVendedor.emit();
  }

  onVendedorCreado(vendedor: UsuarioDto): void {
    this.showCrearVendedorModal = false;
    // Si el vendedor se creó exitosamente, lo asignamos automáticamente al subcanal
    if (vendedor && vendedor.id) {
      this.asignarVendedorConfirmado.emit(Number(vendedor.id));
    }
  }

  closeCrearVendedorModal(): void {
    this.showCrearVendedorModal = false;
  }
}
