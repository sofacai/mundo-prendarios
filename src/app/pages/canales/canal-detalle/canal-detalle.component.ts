// src/app/pages/canales/canal-detalle/canal-detalle.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, forkJoin } from 'rxjs';


import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { OperacionService, Operacion } from 'src/app/core/services/operacion.service';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';

// Importar componentes nuevos
import { CanalHeaderComponent } from '../components/canal-header/canal-header.component';
import { CanalTabsNavigationComponent } from '../components/canal-tabs-navigation/canal-tabs-navigation.component';
import { CanalGeneralInfoComponent } from '../components/canal-general-info/canal-general-info.component';
import { CanalUbicacionComponent } from '../components/canal-ubicacion/canal-ubicacion.component';
import { CanalInfoFiscalComponent } from '../components/canal-info-fiscal/canal-info-fiscal.component';
import { CanalInfoBancariaComponent } from '../components/canal-info-bancaria/canal-info-bancaria.component';
import { CanalOficialesComponent } from '../components/canal-oficiales/canal-oficiales.component';
import { CanalSubcanalesComponent } from '../components/canal-subcanales/canal-subcanales.component';
import { CanalPlanesComponent } from '../components/canal-planes/canal-planes.component';
import { CanalOperacionesComponent } from '../components/canal-operaciones/canal-operaciones.component';
import { CanalVendedoresComponent } from '../components/canal-vendedores/canal-vendedores.component';
import { CanalEstadisticasComponent } from '../components/canal-estadisticas/canal-estadisticas.component';

@Component({
  selector: 'app-canal-detalle',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    SidebarComponent,
    // Agregar nuevos componentes
    CanalHeaderComponent,
    CanalTabsNavigationComponent,
    CanalGeneralInfoComponent,
    CanalUbicacionComponent,
    CanalInfoFiscalComponent,
    CanalInfoBancariaComponent,
    CanalOficialesComponent,
    CanalSubcanalesComponent,
    CanalPlanesComponent,
    CanalOperacionesComponent,
    CanalVendedoresComponent,
    CanalEstadisticasComponent
  ],
  templateUrl: './canal-detalle.component.html',
  styleUrls: ['./canal-detalle.component.scss']
})
export class CanalDetalleComponent implements OnInit, OnDestroy {
  canalId!: number;
  canal: Canal | null = null;
  loading = true;
  error: string | null = null;
  activeTab = 'general'; // Default active tab

  // Propiedades para oficiales comerciales
  oficialesComerciales: any[] = [];
  loadingOficiales = false;
  errorOficiales: string | null = null;

  // Estadísticas
  subcanalesActivos = 0;
  subcanalesInactivos = 0;
  planesActivos = 0;
  planesInactivos = 0;
  totalOperaciones = 0;
  totalVendedores = 0;


  // Editar canal
  editingSections: { [key: string]: boolean } = {
    general: false,
    ubicacion: false,
    fiscal: false,
    bancaria: false,
    titular: false
  };

  loadingSubcanales: Map<number, boolean> = new Map();
  loadingVendedores: Map<number, boolean> = new Map();

  canalFormData: any = null;

  // Sidebar state
  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  // Modal states
  modalEditarOpen = false;

  // Datos cargados
  subcanales: Subcanal[] = [];
  vendedores: any[] = [];
  operaciones: Operacion[] = [];
  clientes: Cliente[] = [];
  operacionesLiquidadas = 0; // Nueva propiedad

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private canalService: CanalService,
    private subcanalService: SubcanalService,
    private usuarioService: UsuarioService,
    private operacionService: OperacionService,
    private clienteService: ClienteService,
    private sidebarStateService: SidebarStateService
  ) { }

  ngOnInit() {
    // Get canal ID from route params
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.canalId = +params['id'];
        this.loadCanalData();
      } else {
        this.error = 'ID de canal no encontrado';
        this.loading = false;
      }
    });

    window.addEventListener('resize', this.handleResize.bind(this));

  this.handleResize();
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
    window.removeEventListener('resize', this.handleResize.bind(this));

  }
  private handleResize() {
    this.adjustContentArea();
  }

  private adjustContentArea() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      const isMobile = window.innerWidth < 992;

      if (isMobile) {
        // En móviles, eliminar todos los márgenes
        contentArea.style.marginLeft = '0';
        contentArea.classList.remove('sidebar-collapsed');
        contentArea.classList.remove('sidebar-expanded');
      } else {
        // En desktop, aplicar los márgenes según el estado del sidebar
        if (this.isSidebarCollapsed) {
          contentArea.style.marginLeft = '70px'; // Ancho del sidebar colapsado
          contentArea.classList.add('sidebar-collapsed');
          contentArea.classList.remove('sidebar-expanded');
        } else {
          contentArea.style.marginLeft = '260px'; // Ancho del sidebar expandido
          contentArea.classList.add('sidebar-expanded');
          contentArea.classList.remove('sidebar-collapsed');
        }
      }
    }
  }

  loadCanalData() {
    this.loading = true;

    // Obtener el canal principal
    this.canalService.getCanalDetalles(this.canalId).subscribe({
      next: (canal) => {
        this.canal = canal;
        this.calculateBaseStatistics();

        // Cargar oficiales comerciales
        this.cargarOficialesComerciales(this.canalId);

        // Obtener operaciones liquidadas
        this.operacionService.getOperaciones().subscribe({
          next: (operaciones) => {
            // Filtrar operaciones del canal actual
            this.operaciones = operaciones.filter(op => op.canalId === this.canalId);

            // Contar operaciones liquidadas
            this.operacionesLiquidadas = this.operaciones.filter(op => op.estado === 'Liquidada').length;

            // Cargar datos adicionales en paralelo
            this.loadAdditionalData();
          },
          error: (err) => {
            console.error('Error al cargar operaciones:', err);
            // Seguir con la carga de datos adicionales aunque falle la carga de operaciones
            this.loadAdditionalData();
          }
        });
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del canal.';
        console.error('Error cargando canal:', err);
        this.loading = false;
      }
    });
  }

  cargarOficialesComerciales(canalId: number) {
    this.loadingOficiales = true;
    this.errorOficiales = null;

    this.canalService.getOficialesComercialCanal(canalId).subscribe({
      next: (data) => {
        this.oficialesComerciales = data;
        this.loadingOficiales = false;
      },
      error: (err) => {
        console.error('Error al cargar oficiales comerciales:', err);
        this.errorOficiales = 'No se pudieron cargar los oficiales comerciales';
        this.loadingOficiales = false;
      }
    });
  }
  loadAdditionalData() {
    // Usamos forkJoin para manejar múltiples solicitudes en paralelo
    forkJoin({
      subcanales: this.subcanalService.getSubcanales(), // Filtramos en el cliente
      vendedores: this.usuarioService.getUsuariosPorRol(3), // Rol 3 = Vendors, filtrar por canal en el cliente
      operaciones: this.operacionService.getOperaciones(), // Filtramos en el cliente
      clientes: this.clienteService.getClientesPorCanal(this.canalId)
    }).subscribe({
      next: (result) => {
        // Filtramos subcanales de este canal
        this.subcanales = result.subcanales.filter(s => s.canalId === this.canalId);

        // Filtramos vendedores de este canal (suponiendo que tienen canalId)
        this.vendedores = result.vendedores.filter(v => {
          // Verificar si el vendedor está asignado a algún subcanal de este canal
          return this.subcanales.some(s =>
            s.vendors && Array.isArray(s.vendors) &&
            s.vendors.some(vendor => vendor.id === v.id)
          );
        });

        // Filtramos operaciones de este canal
        this.operaciones = result.operaciones.filter(o => o.canalId === this.canalId);

        // Clientes ya vienen filtrados por canal
        this.clientes = result.clientes;

        // Actualizar estadísticas
        this.updateStatistics();

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando datos adicionales:', err);
        // Mostramos error pero no bloqueamos la vista
        this.loading = false;
      }
    });
  }

  calculateBaseStatistics() {
    if (!this.canal) return;

    // Estadísticas básicas del canal
    this.subcanalesActivos = this.canal.subcanales?.filter(s => s.activo).length || 0;
    this.subcanalesInactivos = (this.canal.subcanales?.length || 0) - this.subcanalesActivos;

    this.planesActivos = this.canal.planesCanal?.filter(p => p.activo).length || 0;
    this.planesInactivos = (this.canal.planesCanal?.length || 0) - this.planesActivos;

    this.totalOperaciones = this.canal.numeroOperaciones || 0;
  }

  updateStatistics() {
    // Actualizar estadísticas con datos adicionales
    this.totalVendedores = this.vendedores.length;
  }

  // Change active tab
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Navigate back to canales list
  goBack() {
    this.router.navigate(['/canales']);
  }

  toggleEditing(section: string) {
    // Resetear el objeto de formulario para esta sección específica
    this.canalFormData = {};

    // Copiar solo los datos relevantes para esta sección
    if (this.canal) {
      switch(section) {
        case 'general':
          this.canalFormData = {
            nombreFantasia: this.canal.nombreFantasia,
            razonSocial: this.canal.razonSocial,
            tipoCanal: this.canal.tipoCanal,
            activo: this.canal.activo
          };
          break;
        case 'ubicacion':
          this.canalFormData = {
            provincia: this.canal.provincia,
            localidad: this.canal.localidad,
            direccion: this.canal.direccion || ''
          };
          break;
        case 'fiscal':
          this.canalFormData = {
            cuit: this.canal.cuit
          };
          break;
        case 'bancaria':
          this.canalFormData = {
            banco: this.canal.banco,
            cbu: this.canal.cbu,
            alias: this.canal.alias,
            numCuenta: this.canal.numCuenta,
            opcionesCobro: this.canal.opcionesCobro || ''
          };
          break;
        case 'titular':
          this.canalFormData = {
            titularNombreCompleto: this.canal.titularNombreCompleto || '',
            titularTelefono: this.canal.titularTelefono || '',
            titularEmail: this.canal.titularEmail || ''
          };
          break;
      }
    }

    this.editingSections[section] = !this.editingSections[section];
  }

  saveSection(section: string) {
    if (!this.canal || !this.canalFormData) return;

    this.loading = true;

    // Preparar el objeto a enviar, incluyendo solo lo necesario
    const updateData: any = {
      ...this.canal, // Tomamos los datos base del canal actual
      ...this.canalFormData // Sobrescribimos solo los campos editados
    };

    // Aseguramos que no enviamos información de oficiales comerciales
    delete updateData.oficialesComerciales;
    // Eliminamos otros campos complejos que no deberían enviarse
    delete updateData.subcanales;
    delete updateData.planesCanal;

    this.canalService.updateCanal(this.canal.id, updateData).subscribe({
      next: (canal) => {
        this.canal = canal;
        this.editingSections[section] = false;
        this.loading = false;

        // Opcional: recargar todos los datos para asegurar consistencia
        this.loadCanalData();
      },
      error: (err) => {
        console.error('Error al actualizar el canal:', err);
        this.loading = false;
      }
    });
  }

  cancelEditing(section: string) {
    this.editingSections[section] = false;
    this.canalFormData = {};
  }

  // Para actualizar un campo individual
  updateField(field: string, value: any) {
    if (this.canalFormData) {
      this.canalFormData[field] = value;
    }
  }

  isEditing(section: string): boolean {
    return this.editingSections[section];
  }

  onProvinciaChange(provincia: {id: string, nombre: string}) {
    if (this.canalFormData) {
      this.canalFormData.provincia = provincia.nombre;
    }
  }

  onLocalidadChange(localidad: {id: string, nombre: string}) {
    if (this.canalFormData) {
      this.canalFormData.localidad = localidad.nombre;
    }
  }

  // Servicio de activar o desactivar
  toggleCanalEstado() {
    if (!this.canal) return;

    this.loading = true;

    // Determinar qué endpoint llamar según el estado actual
    const request = this.canal.activo
      ? this.canalService.desactivarCanal(this.canal.id)
      : this.canalService.activarCanal(this.canal.id);

    request.subscribe({
      next: (canalActualizado) => {
        this.canal = canalActualizado;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cambiar estado del canal:', err);
        this.error = 'No se pudo cambiar el estado del canal. Intente nuevamente.';
        this.loading = false;
      }
    });
  }

  toggleOficialEstado(oficialId: number, estadoActual: boolean) {
    this.loadingOficiales = true;

    const request = estadoActual
      ? this.usuarioService.desactivarUsuario(oficialId)
      : this.usuarioService.activarUsuario(oficialId);

    request.subscribe({
      next: () => {
        // Actualizar el estado en la lista local
        this.oficialesComerciales = this.oficialesComerciales.map(oficial => {
          if (oficial.oficialComercialId === oficialId) {
            return {...oficial, activo: !estadoActual};
          }
          return oficial;
        });
        this.loadingOficiales = false;
      },
      error: (err) => {
        console.error('Error al cambiar estado del oficial:', err);
        this.errorOficiales = 'No se pudo cambiar el estado del oficial.';
        this.loadingOficiales = false;
      }
    });
  }

  toggleSubcanalEstado(subcanalId: number, estadoActual: boolean) {
    this.loadingSubcanales.set(subcanalId, true);

    const request = estadoActual
      ? this.subcanalService.desactivarSubcanal(subcanalId)
      : this.subcanalService.activarSubcanal(subcanalId);

    request.subscribe({
      next: () => {
        // Obtener el subcanal completo actualizado
        this.subcanalService.getSubcanal(subcanalId).subscribe({
          next: (subcanalCompleto) => {
            // Actualizar el subcanal en la lista con todos sus datos
            this.subcanales = this.subcanales.map(subcanal =>
              subcanal.id === subcanalId ? subcanalCompleto : subcanal
            );

            // Actualizar contadores
            this.subcanalesActivos = this.subcanales.filter(s => s.activo).length;
            this.subcanalesInactivos = this.subcanales.length - this.subcanalesActivos;

            // Quitar indicador de carga
            this.loadingSubcanales.set(subcanalId, false);
          },
          error: (err) => {
            console.error('Error al obtener detalles actualizados del subcanal:', err);
            this.loadingSubcanales.set(subcanalId, false);
          }
        });
      },
      error: (err) => {
        console.error('Error al cambiar estado del subcanal:', err);
        this.loadingSubcanales.set(subcanalId, false);
      }
    });
  }

  // Método auxiliar para verificar si un subcanal está cargando
  isSubcanalLoading(subcanalId: number): boolean {
    return this.loadingSubcanales.get(subcanalId) === true;
  }

  toggleVendorEstado(vendorId: number, estadoActual: boolean) {
    this.loadingVendedores.set(vendorId, true);

    const request = estadoActual
      ? this.usuarioService.desactivarUsuario(vendorId)
      : this.usuarioService.activarUsuario(vendorId);

    request.subscribe({
      next: () => {
        // Obtener el usuario completo actualizado
        this.usuarioService.getUsuario(vendorId).subscribe({
          next: (vendorActualizado) => {
            // Actualizar el vendedor en la lista con todos sus datos
            this.vendedores = this.vendedores.map(vendor =>
              vendor.id === vendorId ? vendorActualizado : vendor
            );

            // Quitar indicador de carga
            this.loadingVendedores.set(vendorId, false);
          },
          error: (err) => {
            console.error('Error al obtener detalles actualizados del vendedor:', err);
            this.loadingVendedores.set(vendorId, false);
          }
        });
      },
      error: (err) => {
        console.error('Error al cambiar estado del vendedor:', err);
        this.loadingVendedores.set(vendorId, false);
      }
    });
  }

  isVendorLoading(vendorId: number): boolean {
    return this.loadingVendedores.get(vendorId) === true;
  }

  // Método para ver detalle de un subcanal
  verDetalleSubcanal(subcanalId: number): void {
    this.router.navigate(['/subcanales', subcanalId]);
  }

  // Método para ver detalle de un plan
  verDetallePlan(planId: number): void {
    this.router.navigate(['/planes', planId]);
  }

  verDetalleOperacion(operacionId: number): void {
    this.router.navigate(['/operaciones', operacionId]);
  }

  // Método para filtrar operaciones
  filtrarOperaciones(): void {

  }

  // Método para ver detalle de un vendedor
  verDetalleVendedor(vendorId: number): void {
    this.router.navigate(['/usuarios', vendorId]);
  }

  // Método para ver detalle de un usuario (oficial comercial)
  verDetalleUsuario(userId: number): void {
    this.router.navigate(['/usuarios', userId]);
  }

}
