// Actualizar subcanal-vendedores-tab.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { UsuarioDto, UsuarioService } from 'src/app/core/services/usuario.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-subcanal-vendedores-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subcanal-vendedores-tab.component.html',
  styleUrls: ['./subcanal-vendedores-tab.component.scss']
})
export class SubcanalVendedoresTabComponent {
  @Input() subcanal!: Subcanal;
  @Input() loadingVendedores: Map<number, boolean> = new Map();
  @Input() availableVendors: UsuarioDto[] = [];

  @Output() asignarVendedor = new EventEmitter<void>();
  @Output() asignarVendedorConfirmado = new EventEmitter<number>();
  @Output() toggleVendorEstado = new EventEmitter<{ vendorId: number, estadoActual: boolean }>();
  @Output() desasignarVendor = new EventEmitter<number>();
  @Output() verDetalleVendor = new EventEmitter<number>();

  // Modal state
  showModal = false;
  selectedVendorId: string | number = '';
  isLoading = false;
  errorMessage: string | null = null;
  assigning = false;

  // Constructor para inyectar servicios
  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  // Métodos para calcular estadísticas
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

  // Modal methods
  openModal(): void {
    this.showModal = true;
    this.selectedVendorId = '';
    this.errorMessage = null;
    this.isLoading = true;

    // Cargar vendedores disponibles
    this.asignarVendedor.emit();
  }

  // Agregar un método para actualizar el estado de carga
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

  confirmarAsignacion(): void {
    if (this.selectedVendorId && !this.assigning) {
      this.assigning = true;
      this.errorMessage = null;

      // Emit event with selected vendor id
      this.asignarVendedorConfirmado.emit(Number(this.selectedVendorId));

      // El componente padre debe encargarse de cerrar el modal después de completar la operación
      // Para esto, necesitamos exponer un método público que el padre pueda llamar
    }
  }

  // Método público para que el padre pueda cerrar el modal y limpiar el estado
  finalizarAsignacion(exito: boolean, mensaje?: string): void {
    this.assigning = false;

    if (!exito && mensaje) {
      this.errorMessage = mensaje;
    } else {
      this.closeModal();
    }
  }
}
