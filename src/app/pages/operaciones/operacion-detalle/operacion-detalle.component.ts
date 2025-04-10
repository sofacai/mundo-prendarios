import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { OperacionService, Operacion } from 'src/app/core/services/operacion.service';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-operacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SidebarComponent
  ],
  templateUrl: './operacion-detalle.component.html',
  styleUrls: ['./operacion-detalle.component.scss']
})
export class OperacionDetalleComponent implements OnInit, OnDestroy {
  operacionId!: number;
  operacion!: Operacion;
  cliente: Cliente | null = null;
  vendor: UsuarioDto | null = null;
  canal: Canal | null = null;
  subcanal: Subcanal | null = null;

  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private operacionService: OperacionService,
    private clienteService: ClienteService,
    private usuarioService: UsuarioService,
    private canalService: CanalService,
    private subcanalService: SubcanalService,
    private sidebarStateService: SidebarStateService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.operacionId = +params['id'];
        this.cargarOperacion();
      } else {
        this.error = 'ID de operación no encontrado';
        this.loading = false;
      }
    });

    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        this.isSidebarCollapsed = collapsed;
        this.adjustContentArea();
      }
    );
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  private adjustContentArea() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      if (this.isSidebarCollapsed) {
        contentArea.style.marginLeft = '70px'; // Ancho del sidebar colapsado
      } else {
        contentArea.style.marginLeft = '260px'; // Ancho del sidebar expandido
      }
    }
  }

  verDetalleSubcanal(id: number): void {
    this.router.navigate(['/subcanales', id]);
  }

  verDetalleCanal(id: number): void {
    this.router.navigate(['/canales', id]);
  }

  verDetalleUsuario(id: number): void {
    this.router.navigate(['/usuarios', id]);
  }

  cargarOperacion() {
    this.loading = true;
    this.error = null;

    this.operacionService.getOperacionById(this.operacionId).subscribe({
      next: (operacion) => {
        this.operacion = operacion;

        // Cargar datos relacionados en paralelo
        this.cargarCliente(operacion.clienteId);
        if (operacion.vendedorId) {
          this.cargarVendor(operacion.vendedorId);
        }
        if (operacion.canalId) {
          this.cargarCanal(operacion.canalId);
        }
        if (operacion.subcanalId) {
          this.cargarSubcanal(operacion.subcanalId);
        }
      },
      error: (err) => {
        console.error('Error cargando operación:', err);
        this.error = 'No se pudo cargar la información de la operación';
        this.loading = false;
      }
    });
  }

  cargarCliente(clienteId: number) {
    this.clienteService.getClienteById(clienteId).subscribe({
      next: (cliente) => {
        this.cliente = cliente;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando cliente:', err);
        this.checkLoadingComplete();
      }
    });
  }

  cargarVendor(vendedorId: number) {
    this.usuarioService.getUsuario(vendedorId).subscribe({
      next: (vendor) => {
        this.vendor = vendor;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando vendor:', err);
        this.checkLoadingComplete();
      }
    });
  }

  cargarCanal(canalId: number) {
    this.canalService.getCanal(canalId).subscribe({
      next: (canal) => {
        this.canal = canal;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando canal:', err);
        this.checkLoadingComplete();
      }
    });
  }

  cargarSubcanal(subcanalId: number) {
    this.subcanalService.getSubcanal(subcanalId).subscribe({
      next: (subcanal) => {
        this.subcanal = subcanal;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando subcanal:', err);
        this.checkLoadingComplete();
      }
    });
  }

  checkLoadingComplete() {
    // Todos los datos relacionados han sido intentados cargar
    this.loading = false;
  }

  goBack() {
    this.router.navigate(['/operaciones']);
  }

  // Métodos de formato
  formatMonto(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'No disponible';

    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'badge-success';
      case 'pendiente':
        return 'badge-warning';
      case 'completado':
        return 'badge-info';
      case 'cancelado':
        return 'badge-danger';
      case 'Ingresada':
        return 'badge-info';
      case 'liquidada':
        return 'badge-success'; // Green for liquidated operations
      default:
        return 'badge-light';
    }
  }
  calcularCuotaMensual(): string {
    if (!this.operacion) return '-';
    const { monto, tasa, meses } = this.operacion;
    const cuota = (monto * (1 + tasa/100)) / meses;
    return this.formatMonto(cuota);
  }
}
