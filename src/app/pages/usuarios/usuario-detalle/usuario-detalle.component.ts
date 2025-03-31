// src/app/pages/usuarios/usuario-detalle/usuario-detalle.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, forkJoin } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { UsuarioService, UsuarioDto, VendorEstadisticasDto } from 'src/app/core/services/usuario.service';
import { OperacionService, Operacion } from 'src/app/core/services/operacion.service';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { ClienteVendorService } from 'src/app/core/services/cliente-vendor.service';
import { RolType } from 'src/app/core/models/usuario.model';

// Importar componentes hijo
import { UsuarioHeaderComponent } from '../components/usuario-header/usuario-header.component';
import { UsuarioTabsNavigationComponent } from '../components/usuario-tabs-navigation/usuario-tabs-navigation.component';
import { UsuarioOperacionesComponent } from '../components/usuario-operaciones/usuario-operaciones.component';
import { UsuarioClientesComponent } from '../components/usuario-clientes/usuario-clientes.component';
import { UsuarioSubcanalesComponent } from '../components/usuario-subcanales/usuario-subcanales.component';
import { UsuarioCanalesComponent } from '../components/usuario-canales/usuario-canales.component';
import { UsuarioEstadisticasComponent } from '../components/usuario-estadisticas/usuario-estadisticas.component';

@Component({
  selector: 'app-usuario-detalle',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    SidebarComponent,
    UsuarioHeaderComponent,
    UsuarioTabsNavigationComponent,
    UsuarioOperacionesComponent,
    UsuarioClientesComponent,
    UsuarioSubcanalesComponent,
    UsuarioCanalesComponent,
    UsuarioEstadisticasComponent
  ],
  templateUrl: './usuario-detalle.component.html',
  styleUrls: ['./usuario-detalle.component.scss']
})
export class UsuarioDetalleComponent implements OnInit, OnDestroy {
  usuarioId!: number;
  usuario!: UsuarioDto;
  loading = true;
  error: string | null = null;
  activeTab = 'operaciones'; // Tab por defecto

  // Sidebar state
  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  // Datos para el detalle
  estadisticas: VendorEstadisticasDto | null = null;
  operaciones: Operacion[] = [];
  clientes: Cliente[] = [];
  subcanales: Subcanal[] = [];
  canales: Canal[] = [];

  operacionesActivas: number = 0;
montoTotal: number = 0;

  // Estados de carga
  loadingOperaciones = false;
  loadingClientes = false;
  loadingSubcanales = false;
  loadingCanales = false;

  // Estados de error
  errorOperaciones: string | null = null;
  errorClientes: string | null = null;
  errorSubcanales: string | null = null;
  errorCanales: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private operacionService: OperacionService,
    private clienteService: ClienteService,
    private clienteVendorService: ClienteVendorService,
    private subcanalService: SubcanalService,
    private canalService: CanalService,
    private sidebarStateService: SidebarStateService
  ) { }

  ngOnInit() {
    // Get usuario ID from route params
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.usuarioId = +params['id'];
        this.loadUsuarioData();
      } else {
        this.error = 'ID de usuario no encontrado';
        this.loading = false;
      }
    });

    // Subscribe to sidebar state changes
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

  loadUsuarioData() {
    this.loading = true;
    this.error = null;

    // Obtener datos del usuario
    this.usuarioService.getUsuario(this.usuarioId).subscribe({
      next: (usuario) => {
        this.usuario = usuario;

        // Ajustar el tab activo según el rol
        this.setInitialActiveTab();

        // Cargar datos adicionales según el rol del usuario
        this.loadDataBasedOnRole();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del usuario.';
        console.error('Error cargando usuario:', err);
        this.loading = false;
      }
    });
  }

  setInitialActiveTab() {
    // Establecer el tab activo según el rol
    switch (this.usuario.rolId) {
      case RolType.Vendor:
        this.activeTab = 'operaciones';
        break;
      case RolType.AdminCanal:
        this.activeTab = 'subcanales';
        break;
      case RolType.OficialComercial:
        this.activeTab = 'canales';
        break;
      default:
        this.activeTab = 'general';
    }
  }

  loadDataBasedOnRole() {
    // Carga de datos común para todos los roles
    this.loading = true;

    // Para los vendors cargar estadísticas
    if (this.usuario.rolId === RolType.Vendor) {
      this.loadVendorData();
    }
    // Para adminCanal cargar subcanales
    else if (this.usuario.rolId === RolType.AdminCanal) {
      this.loadAdminCanalData();
    }
    // Para oficialComercial cargar canales
    else if (this.usuario.rolId === RolType.OficialComercial) {
      this.loadOficialComercialData();
    }
    // Para administrador, no se cargan datos adicionales
    else {
      this.loading = false;
    }
  }

  loadVendorData() {
    // Cargar estadísticas del vendor
    this.usuarioService.getVendorEstadisticas(this.usuarioId).subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;

        // Cargar operaciones y clientes en paralelo para vendors
        this.loadingOperaciones = true;
        this.loadingClientes = true;
        this.loadingSubcanales = true;

        // Cargar operaciones donde vendedorId sea igual a usuarioId
        this.operacionService.getOperaciones().subscribe({
          next: (operaciones) => {
            this.operaciones = operaciones.filter(op => op.vendedorId === this.usuarioId);
            this.loadingOperaciones = false;
            this.checkLoadingComplete();
          },
          error: (err) => {
            console.error('Error cargando operaciones del vendor:', err);
            this.errorOperaciones = 'Error al cargar las operaciones del vendor.';
            this.loadingOperaciones = false;
            this.checkLoadingComplete();
          }
        });

        // Cargar clientes asignados a este vendor
        this.loadClientesVendor();

        // Obtener subcanales a los que está asignado el vendor
        this.loadSubcanalesVendor();
      },
      error: (err) => {
        console.error('Error cargando estadísticas del vendor:', err);
        this.loading = false;
      }
    });
  }

  loadClientesVendor() {
    this.loadingClientes = true;
    this.clienteVendorService.obtenerClientesPorVendor(this.usuarioId).subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        this.loadingClientes = false;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando clientes del vendor:', err);
        this.errorClientes = 'Error al cargar los clientes del vendor.';
        this.loadingClientes = false;
        this.checkLoadingComplete();
      }
    });
  }

  loadSubcanalesVendor() {
    this.loadingSubcanales = true;
    this.subcanalService.getSubcanales().subscribe({
      next: (subcanales) => {
        // Filtrar subcanales donde el vendor aparezca en la lista de vendors
        this.subcanales = subcanales.filter(subcanal =>
          subcanal.vendors && subcanal.vendors.some(vendor => vendor.id === this.usuarioId)
        );
        this.loadingSubcanales = false;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando subcanales del vendor:', err);
        this.errorSubcanales = 'Error al cargar los subcanales del vendor.';
        this.loadingSubcanales = false;
        this.checkLoadingComplete();
      }
    });
  }

  loadAdminCanalData() {
    this.loadingSubcanales = true;
    this.subcanalService.getSubcanales().subscribe({
      next: (subcanales) => {
        // Filtrar subcanales donde adminCanalId es igual a usuarioId
        this.subcanales = subcanales.filter(subcanal => subcanal.adminCanalId === this.usuarioId);
        this.loadingSubcanales = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando subcanales del admin de canal:', err);
        this.errorSubcanales = 'Error al cargar los subcanales administrados.';
        this.loadingSubcanales = false;
        this.loading = false;
      }
    });
  }

  loadOficialComercialData() {
    this.loadingCanales = true;
    this.canalService.getCanales().subscribe({
      next: (canales) => {
        // Filtrar canales donde el oficial comercial aparezca en la lista
        this.canales = canales.filter(canal =>
          canal.oficialesComerciales && canal.oficialesComerciales.some(oficial => oficial.id === this.usuarioId)
        );
        this.loadingCanales = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando canales del oficial comercial:', err);
        this.errorCanales = 'Error al cargar los canales asignados.';
        this.loadingCanales = false;
        this.loading = false;
      }
    });
  }

  // Verificar si todas las cargas han finalizado
  checkLoadingComplete() {
    if (this.usuario.rolId === RolType.Vendor) {
      if (!this.loadingOperaciones && !this.loadingClientes && !this.loadingSubcanales) {
        this.loading = false;
      }
    }
    else if (this.usuario.rolId === RolType.AdminCanal) {
      if (!this.loadingSubcanales) {
        this.loading = false;
      }
    }
    else if (this.usuario.rolId === RolType.OficialComercial) {
      if (!this.loadingCanales) {
        this.loading = false;
      }
    }
    else {
      this.loading = false;
    }
  }

  // Cambiar pestaña activa
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Navegar de vuelta a la lista de usuarios
  goBack() {
    this.router.navigate(['/usuarios']);
  }

  // Toggle estado del usuario (activo/inactivo)
  toggleUsuarioEstado() {
    const request = this.usuario.activo
      ? this.usuarioService.desactivarUsuario(this.usuarioId)
      : this.usuarioService.activarUsuario(this.usuarioId);

    request.subscribe({
      next: () => {
        // Actualizar el estado en la UI
        this.usuario.activo = !this.usuario.activo;
      },
      error: (err) => {
        console.error('Error al cambiar el estado del usuario:', err);
        this.error = 'No se pudo cambiar el estado del usuario.';
      }
    });
  }

  // Navegar al detalle de cliente
  verDetalleCliente(clienteId: number) {
    this.router.navigate(['/clientes', clienteId]);
  }

  // Navegar al detalle de operación
  verDetalleOperacion(operacionId: number) {
    this.router.navigate(['/operaciones', operacionId]);
  }

  // Navegar al detalle de subcanal
  verDetalleSubcanal(subcanalId: number) {
    this.router.navigate(['/subcanales', subcanalId]);
  }

  // Navegar al detalle de canal
  verDetalleCanal(canalId: number) {
    this.router.navigate(['/canales', canalId]);
  }

  calcularEstadisticasHeader() {
    if (!this.operaciones || this.operaciones.length === 0) {
      this.operacionesActivas = 0;
      this.montoTotal = 0;
      return;
    }

    // Filtrar operaciones activas/aprobadas (no canceladas ni rechazadas)
    const operacionesActivas = this.operaciones.filter(op =>
      !op.estado ||
      (op.estado.toLowerCase() !== 'cancelado' &&
       op.estado.toLowerCase() !== 'rechazado')
    );

    this.operacionesActivas = operacionesActivas.length;

    // Calcular monto total SOLO de operaciones activas/aprobadas
    this.montoTotal = operacionesActivas.reduce((sum, op) => sum + op.monto, 0);
  }
}
