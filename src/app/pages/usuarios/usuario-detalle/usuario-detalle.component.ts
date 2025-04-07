// src/app/pages/usuarios/usuario-detalle/usuario-detalle.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, forkJoin, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

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
import { UsuarioSubcanalesComponent } from '../components/usuario-subcanales/usuario-subcanales.component';
import { UsuarioCanalesComponent } from '../components/usuario-canales/usuario-canales.component';
import { UsuarioEstadisticasComponent } from '../components/usuario-estadisticas/usuario-estadisticas.component';
import { UsuarioPasswordComponent } from '../components/usuario-password/usuario-password.component';
import { UsuarioUsuariosComponent } from '../components/usuario-usuarios/usuario-usuarios.component';

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
    UsuarioSubcanalesComponent,
    UsuarioCanalesComponent,
    UsuarioEstadisticasComponent,
    UsuarioPasswordComponent,
    UsuarioUsuariosComponent
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

  showPasswordModal = false;

  // Datos para el detalle
  estadisticas: VendorEstadisticasDto | null = null;
  operaciones: Operacion[] = [];
  clientes: Cliente[] = [];
  subcanales: Subcanal[] = [];
  canales: Canal[] = [];

  usuariosRelacionados: UsuarioDto[] = [];
  loadingUsuariosRelacionados = false;
  errorUsuariosRelacionados: string | null = null;

  operacionesActivas: number = 0;
  montoTotal: number = 0;

  // Estados de carga
  loadingOperaciones = false;
  loadingSubcanales = false;
  loadingCanales = false;

  // Estados de error
  errorOperaciones: string | null = null;
  errorSubcanales: string | null = null;
  errorCanales: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private operacionService: OperacionService,
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
    this.loading = true;

    if (this.usuario.rolId === RolType.Vendor) {
      this.loadVendorData();
    }
    else if (this.usuario.rolId === RolType.AdminCanal) {
      this.loadAdminCanalData();
    }
    else if (this.usuario.rolId === RolType.OficialComercial) {
      this.loadOficialComercialData();
    }
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
        this.loadingSubcanales = true;

        // Cargar operaciones donde vendedorId sea igual a usuarioId
        this.operacionService.getOperaciones().subscribe({
          next: (operaciones) => {
            this.operaciones = operaciones.filter(op => op.vendedorId === this.usuarioId);
            this.loadingOperaciones = false;
            this.calcularEstadisticasHeader();
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

        // Obtener subcanales a los que está asignado el vendor
        this.loadSubcanalesVendor();
      },
      error: (err) => {
        console.error('Error cargando estadísticas del vendor:', err);
        this.loading = false;
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
    this.loadingUsuariosRelacionados = true;
    this.loadingOperaciones = true;

    // Obtener todos los subcanales que administra
    this.subcanalService.getSubcanales().pipe(
      switchMap(subcanales => {
        // Filtramos los subcanales administrados por este usuario
        this.subcanales = subcanales.filter(subcanal => subcanal.adminCanalId === this.usuarioId);
        this.loadingSubcanales = false;

        if (this.subcanales.length === 0) {
          return of({ operaciones: [], usuarios: [], clientes: [] });
        }

        // Obtenemos los IDs de los subcanales para los siguientes filtros
        const subcanalIds = this.subcanales.map(s => s.id);

        // Cargamos operaciones, usuarios y clientes relacionados con estos subcanales
        return forkJoin({
          operaciones: this.operacionService.getOperaciones(),
          usuarios: this.usuarioService.getUsuariosPorRol(RolType.Vendor),
        });
      })
    ).subscribe({
      next: (results) => {
        // Procesamos los resultados si tenemos subcanales
        if (this.subcanales.length > 0) {
          const subcanalIds = this.subcanales.map(s => s.id);

          // Filtramos operaciones de estos subcanales
          this.operaciones = results.operaciones.filter(op =>
            subcanalIds.includes(op.subcanalId || 0)
          );
          this.loadingOperaciones = false;
          this.calcularEstadisticasHeader();

          // Filtramos usuarios (vendors) asignados a estos subcanales
          this.usuariosRelacionados = results.usuarios.filter(v =>
            this.subcanales.some(s =>
              s.vendors && s.vendors.some(sv => sv.id === v.id)
            )
          );
          this.loadingUsuariosRelacionados = false;

          // Filtramos clientes relacionados con estos subcanales
          // Esto es aproximado - podría necesitar ajustes según la lógica de negocio

        } else {
          // Si no hay subcanales, limpiamos los datos relacionados
          this.operaciones = [];
          this.loadingOperaciones = false;
          this.usuariosRelacionados = [];
          this.loadingUsuariosRelacionados = false;
          this.clientes = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando datos del AdminCanal:', err);
        this.errorSubcanales = 'Error al cargar los datos.';
        this.loadingSubcanales = false;
        this.loadingUsuariosRelacionados = false;
        this.loadingOperaciones = false;
        this.loading = false;
      }
    });
  }

  loadOficialComercialData() {
    this.loadingCanales = true;
    this.loadingUsuariosRelacionados = true;
    this.loadingOperaciones = true;

    // Get canals only - don't try to get vendor statistics for OficialComercial role
    this.canalService.getCanales().subscribe({
      next: (canales) => {
        // Filter canals where this oficial comercial appears
        this.canales = canales.filter(canal =>
          canal.oficialesComerciales &&
          canal.oficialesComerciales.some(oficial => oficial.id === this.usuarioId));
        this.loadingCanales = false;

        if (this.canales.length === 0) {
          this.loading = false;
          return;
        }

        // Get IDs of canals for filtering
        const canalIds = this.canales.map(c => c.id);

        // Load operations
        this.operacionService.getOperaciones().subscribe({
          next: (operaciones) => {
            this.operaciones = operaciones.filter(op =>
              canalIds.includes(op.canalId || 0));
            this.loadingOperaciones = false;
            this.calcularEstadisticasHeader();
            this.checkLoadingComplete();

            // Get vendors based on operations
            const vendorIds = new Set<number>();
            this.operaciones.forEach(op => {
              if (op.vendedorId) vendorIds.add(op.vendedorId);
            });

            // Load related vendors
            this.usuarioService.getUsuariosPorRol(RolType.Vendor).subscribe({
              next: (vendors) => {
                this.usuariosRelacionados = vendors.filter(v =>
                  vendorIds.has(v.id));
                this.loadingUsuariosRelacionados = false;
                this.checkLoadingComplete();
              },
              error: (err) => {
                console.error('Error loading vendors:', err);
                this.loadingUsuariosRelacionados = false;
                this.checkLoadingComplete();
              }
            });


          },
          error: (err) => {
            console.error('Error loading operations:', err);
            this.errorOperaciones = 'Error al cargar las operaciones.';
            this.loadingOperaciones = false;
            this.checkLoadingComplete();
          }
        });
      },
      error: (err) => {
        console.error('Error cargando canales:', err);
        this.errorCanales = 'Error al cargar los canales asignados.';
        this.loadingCanales = false;
        this.loading = false;
      }
    });
  }
  // Verificar si todas las cargas han finalizado
  checkLoadingComplete() {
    if (this.usuario.rolId === RolType.Vendor) {
      if (!this.loadingOperaciones  && !this.loadingSubcanales) {
        this.loading = false;
      }
    }
    else if (this.usuario.rolId === RolType.AdminCanal) {
      if (!this.loadingSubcanales && !this.loadingUsuariosRelacionados && !this.loadingOperaciones ) {
        this.loading = false;
      }
    }
    else if (this.usuario.rolId === RolType.OficialComercial) {
      if (!this.loadingCanales && !this.loadingUsuariosRelacionados && !this.loadingOperaciones ) {
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

  openPasswordModal() {
    this.showPasswordModal = true;
  }

  closePasswordModal() {
    this.showPasswordModal = false;
  }

  handlePasswordChange(password: string) {
    const passwordComponent = document.querySelector('app-usuario-password') as any;

    this.usuarioService.updatePassword(this.usuarioId, password).subscribe({
      next: () => {
        this.showPasswordModal = false;
        // Opcional: mostrar notificación de éxito
      },
      error: (err) => {
        console.error('Error al cambiar la contraseña:', err);

        // Mostrar error en el componente
        if (passwordComponent) {
          passwordComponent.setError('No se pudo actualizar la contraseña. Inténtelo de nuevo.');
        }
      }
    });
  }
}
