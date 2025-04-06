import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { OperacionService, Operacion } from 'src/app/core/services/operacion.service';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';
import { UbicacionSelectorComponent } from 'src/app/shared/components/ubicacion-selector/ubicacion-selector.component';
import { Gasto, GastoCreate, GastoUpdate } from 'src/app/core/models/gasto.model';

// Importamos los componentes que hemos creado
import { SubcanalHeaderComponent } from '../components/subcanal-header/subcanal-header.component';
import { SubcanalTabsNavigationComponent } from '../components/subcanal-tabs-navigation/subcanal-tabs-navigation.component';
import { SubcanalGeneralTabComponent } from '../components/subcanal-general-tab/subcanal-general-tab.component';
import { SubcanalVendedoresTabComponent } from '../components/subcanal-vendedores-tab/subcanal-vendedores-tab.component';
import { SubcanalGastosTabComponent } from '../components/subcanal-gastos-tab/subcanal-gastos-tab.component';
import { SubcanalOperacionesTabComponent } from '../components/subcanal-operaciones-tab/subcanal-operaciones-tab.component';
import { SubcanalEstadisticasTabComponent } from '../components/subcanal-estadisticas-tab/subcanal-estadisticas-tab.component';
import { GastoFormModalComponent } from '../components/gasto-form-modal/gasto-form-modal.component';
import { SubcanalAdminCanalComponent } from '../components/subcanal-admin-canal/subcanal-admin-canal.component';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-subcanal-detalle',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    // Importamos los componentes que hemos creado
    SubcanalHeaderComponent,
    SubcanalTabsNavigationComponent,
    SubcanalGeneralTabComponent,
    SubcanalVendedoresTabComponent,
    SubcanalGastosTabComponent,
    SubcanalOperacionesTabComponent,
    SubcanalEstadisticasTabComponent,
    GastoFormModalComponent,
    SubcanalAdminCanalComponent
  ],
  templateUrl: './subcanal-detalle.component.html',
  styleUrls: ['./subcanal-detalle.component.scss'],
  host: {'style': 'display: block; height: 100%;'}
})
export class SubcanalDetalleComponent implements OnInit, OnDestroy, AfterViewInit {
  subcanalId!: number;
  subcanal: Subcanal | null = null;
  loading = true;
  error: string | null = null;
  activeTab = 'general'; // Default active tab

  adminCanal: UsuarioDto | null = null;
loadingAdminCanal = false;
errorAdminCanal: string | null = null;

  // Datos cargados
  vendedores: UsuarioDto[] = [];
  clientes: Cliente[] = [];
  operaciones: Operacion[] = [];

  // Estadísticas
  vendedoresActivos = 0;
  vendedoresInactivos = 0;
  clientesTotal = 0;
  operacionesTotal = 0;

  // Editar subcanal
  editingSections: { [key: string]: boolean } = {
    general: false,
    ubicacion: false
  };

  subcanalFormData: any = null;

  // Sidebar state
  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  // Manejo de modales
  // Modal para gastos
  modalGastoOpen = false;
  gastoForm: FormGroup;
  editingGasto: Gasto | null = null;
  loadingGasto = false;
  errorGasto: string | null = null;

  // Modal para vendores
  modalVendorOpen = false;
  vendoresDisponibles: UsuarioDto[] = [];
  loadingVendores = false;
  errorVendor: string | null = null;
  vendorSearchTerm = '';
  vendoresAsignando: Set<number> = new Set();

  loadingSubcanal = false;
  loadingVendedores: Map<number, boolean> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subcanalService: SubcanalService,
    private usuarioService: UsuarioService,
    private operacionService: OperacionService,
    private clienteService: ClienteService,
    private sidebarStateService: SidebarStateService,
    private fb: FormBuilder
  ) {
    this.gastoForm = this.createGastoForm();
  }

  createGastoForm(): FormGroup {
    return this.fb.group({
      id: [0],
      nombre: ['', Validators.required],
      porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      subcanalId: [0]
    });
  }

  ngOnInit() {
    // Get subcanal ID from route params
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.subcanalId = +params['id'];
        this.loadSubcanalData();
      } else {
        this.error = 'ID de subcanal no encontrado';
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

  ngAfterViewInit() {
    // No necesitamos inicializar gráficos aquí, el componente lo hará
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

  cargarAdminCanal(adminCanalId: number) {
    if (!adminCanalId) {
      return;
    }

    this.loadingAdminCanal = true;
    this.errorAdminCanal = null;

    this.usuarioService.getUsuario(adminCanalId).subscribe({
      next: (admin) => {
        this.adminCanal = admin;
        this.loadingAdminCanal = false;
      },
      error: (err) => {
        console.error('Error al cargar admin del canal:', err);
        this.errorAdminCanal = 'No se pudo cargar la información del administrador';
        this.loadingAdminCanal = false;
      }
    });
  }


  loadSubcanalData() {
    this.loading = true;

    // Obtener el subcanal principal
    this.subcanalService.getSubcanal(this.subcanalId).subscribe({
      next: (subcanal) => {
        this.subcanal = subcanal;
        this.calculateBaseStatistics();

        // Cargar el admin del canal si existe
        if (subcanal.adminCanalId) {
          this.cargarAdminCanal(subcanal.adminCanalId);
        }

        // Cargar datos adicionales en paralelo
        this.loadAdditionalData();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del subcanal.';
        console.error('Error cargando subcanal:', err);
        this.loading = false;
      }
    });
  }

  loadAdditionalData() {
    // Usamos forkJoin para manejar múltiples solicitudes en paralelo
    forkJoin({
      // Obtener todos los clientes y filtrar por canalId después
      clientes: this.clienteService.getClientes(),
      // Obtener todas las operaciones y filtrar por subcanalId después
      operaciones: this.operacionService.getOperaciones(),
      // Obtener los vendedores del subcanal directamente - ya filtrados por subcanalId
      vendedores: this.usuarioService.getVendorsPorSubcanal(this.subcanalId)
    }).subscribe({
      next: (result) => {
        // Filtramos clientes de este canal
        this.clientes = result.clientes.filter(c => c.canalId === this.subcanal?.canalId);

        // Filtramos operaciones de este subcanal
        this.operaciones = result.operaciones.filter(o => o.subcanalId === this.subcanalId);

        // Vendedores ya vienen filtrados
        this.vendedores = result.vendedores;

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
    if (!this.subcanal) return;

    // Contadores para vendedores
    this.vendedoresActivos = this.subcanal.vendors?.filter(v => v.activo).length || 0;
    this.vendedoresInactivos = (this.subcanal.vendors?.length || 0) - this.vendedoresActivos;
  }

  updateStatistics() {
    // Actualizar estadísticas con datos adicionales
    this.clientesTotal = this.clientes.length;
    this.operacionesTotal = this.operaciones.length;
  }

  // Change active tab
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Navigate back to subcanales list
  goBack() {
    this.router.navigate(['/subcanales']);
  }

  // Métodos para la edición del subcanal
  toggleEditing(section: string) {
    // Resetear el objeto de formulario para esta sección específica
    this.subcanalFormData = {};

    // Copiar solo los datos relevantes para esta sección
    if (this.subcanal) {
      switch(section) {
        case 'general':
          this.subcanalFormData = {
            nombre: this.subcanal.nombre,
            provincia: this.subcanal.provincia,
            localidad: this.subcanal.localidad,
            comision: this.subcanal.comision,
            activo: this.subcanal.activo
          };
          break;
      }
    }

    this.editingSections[section] = !this.editingSections[section];
  }

  saveSection(section: string) {
    if (!this.subcanal || !this.subcanalFormData) return;

    this.loadingSubcanal = true;

    // Preparar el objeto a enviar, incluyendo solo lo necesario
    const updateData: any = {
      nombre: this.subcanalFormData.nombre || this.subcanal.nombre,
      provincia: this.subcanalFormData.provincia || this.subcanal.provincia,
      localidad: this.subcanalFormData.localidad || this.subcanal.localidad,
      canalId: this.subcanal.canalId,
      adminCanalId: this.subcanal.adminCanalId,
      comision: this.subcanalFormData.comision || this.subcanal.comision
    };

    this.subcanalService.updateSubcanal(this.subcanal.id, updateData).subscribe({
      next: (subcanal) => {
        this.subcanal = subcanal;
        this.editingSections[section] = false;
        this.loadingSubcanal = false;

        // Recargar datos para asegurar consistencia
        this.loadSubcanalData();
      },
      error: (err) => {
        console.error('Error al actualizar el subcanal:', err);
        this.loadingSubcanal = false;
      }
    });
  }

  cancelEditing(section: string) {
    this.editingSections[section] = false;
    this.subcanalFormData = {};
  }

  updateField(event: {field: string, event: Event}) {
    if (this.subcanalFormData) {
      const target = event.event.target as HTMLInputElement | HTMLSelectElement;

      // Convertir a número si es el campo de comisión
      if (event.field === 'comision') {
        this.subcanalFormData[event.field] = parseFloat(target.value);
      } else {
        this.subcanalFormData[event.field] = target.value;
      }
    }
  }

  isEditing(section: string): boolean {
    return this.editingSections[section];
  }

  // Métodos para gastos
  getGastosPorcentaje(): number {
    if (!this.subcanal || !this.subcanal.gastos || this.subcanal.gastos.length === 0) {
      return 0;
    }

    return this.subcanal.gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);
  }

  abrirModalAgregarGasto() {
    this.editingGasto = null;
    this.gastoForm.reset({
      id: 0,
      nombre: '',
      porcentaje: 0,
      subcanalId: this.subcanalId
    });
    this.errorGasto = null;
    this.modalGastoOpen = true;
  }

  editarGasto(gasto: Gasto) {
    this.editingGasto = gasto;
    this.gastoForm.reset({
      id: gasto.id,
      nombre: gasto.nombre,
      porcentaje: gasto.porcentaje,
      subcanalId: gasto.subcanalId || this.subcanalId
    });
    this.errorGasto = null;
    this.modalGastoOpen = true;
  }

  cerrarModalGasto() {
    this.modalGastoOpen = false;
    this.editingGasto = null;
    this.errorGasto = null;
  }

  guardarGasto(gastoData: any) {
    this.loadingGasto = true;

    // Si el ID es 0, es un nuevo gasto
    if (!gastoData.id || gastoData.id === 0) {
      const nuevoGasto: GastoCreate = {
        nombre: gastoData.nombre,
        porcentaje: gastoData.porcentaje,
        subcanalId: this.subcanalId
      };

      this.subcanalService.agregarGasto(this.subcanalId, nuevoGasto).subscribe({
        next: () => {
          this.loadingGasto = false;
          this.cerrarModalGasto();
          this.loadSubcanalData(); // Recargar datos para ver el nuevo gasto
        },
        error: (err) => {
          this.errorGasto = 'Error al agregar el gasto. Intente nuevamente.';
          console.error('Error agregando gasto:', err);
          this.loadingGasto = false;
        }
      });
    } else {
      // Es un gasto existente que queremos actualizar
      const gastoActualizado: GastoUpdate = {
        nombre: gastoData.nombre,
        porcentaje: gastoData.porcentaje
      };

      this.subcanalService.updateGasto(gastoData.id, gastoActualizado).subscribe({
        next: () => {
          this.loadingGasto = false;
          this.cerrarModalGasto();
          this.loadSubcanalData(); // Recargar datos para ver el gasto actualizado
        },
        error: (err) => {
          this.errorGasto = 'Error al actualizar el gasto. Intente nuevamente.';
          console.error('Error actualizando gasto:', err);
          this.loadingGasto = false;
        }
      });
    }
  }

  eliminarGasto(gastoId: number) {
    if (confirm('¿Está seguro que desea eliminar este gasto?')) {
      this.subcanalService.eliminarGasto(gastoId).subscribe({
        next: () => {
          this.loadSubcanalData(); // Recargar datos después de eliminar
        },
        error: (err) => {
          console.error('Error al eliminar el gasto:', err);
          alert('Error al eliminar el gasto. Intente nuevamente.');
        }
      });
    }
  }

  // Métodos para asignar vendedores
  abrirModalAsignarVendedor() {
    this.vendorSearchTerm = '';
    this.vendoresDisponibles = [];
    this.errorVendor = null;
    this.loadingVendores = true;
    this.modalVendorOpen = true;

    // Cargar todos los vendedores para poder filtrar los que no están asignados
    this.usuarioService.getUsuariosPorRol(3).subscribe({ // 3 = Rol de vendedor
      next: (vendores) => {
        // Filtrar para excluir los que ya están asignados al subcanal
        if (this.subcanal && this.subcanal.vendors) {
          const vendedoresAsignados = new Set(this.subcanal.vendors.map(v => v.id));
          this.vendoresDisponibles = vendores.filter(v => !vendedoresAsignados.has(v.id) && v.activo);
        } else {
          this.vendoresDisponibles = vendores.filter(v => v.activo);
        }
        this.loadingVendores = false;
      },
      error: (err) => {
        this.errorVendor = 'Error al cargar los vendedores. Intente nuevamente.';
        console.error('Error cargando vendedores:', err);
        this.loadingVendores = false;
      }
    });
  }

  cerrarModalVendor() {
    this.modalVendorOpen = false;
    this.errorVendor = null;
    this.vendoresDisponibles = [];
  }

  filtrarVendoresDisponibles() {
    // Esta función se llama cuando el usuario escribe en el campo de búsqueda
    if (!this.vendorSearchTerm) return;

    // Si hay término de búsqueda, filtrar los vendedores disponibles
    const term = this.vendorSearchTerm.toLowerCase();
    this.usuarioService.getUsuariosPorRol(3).subscribe({
      next: (allVendores) => {
        // Filtrar por término de búsqueda y excluir los ya asignados
        if (this.subcanal && this.subcanal.vendors) {
          const vendedoresAsignados = new Set(this.subcanal.vendors.map(v => v.id));
          this.vendoresDisponibles = allVendores.filter(v =>
            !vendedoresAsignados.has(v.id) &&
            v.activo &&
            (v.nombre.toLowerCase().includes(term) ||
             v.apellido.toLowerCase().includes(term) ||
             v.email.toLowerCase().includes(term))
          );
        }
      },
      error: (err) => {
        console.error('Error filtrando vendedores:', err);
      }
    });
  }

  asignarVendor(vendorId: number) {
    this.vendoresAsignando.add(vendorId);

    this.subcanalService.asignarVendorASubcanal(this.subcanalId, vendorId).subscribe({
      next: () => {
        this.vendoresAsignando.delete(vendorId);
        this.loadSubcanalData();
        this.cerrarModalVendor();
      },
      error: (err) => {
        this.errorVendor = 'Error al asignar el vendedor. Intente nuevamente.';
        console.error('Error asignando vendedor:', err);
        this.vendoresAsignando.delete(vendorId);
      }
    });
  }

  desasignarVendor(vendorId: number) {
    if (confirm('¿Está seguro que desea desasignar este vendedor del subcanal?')) {
      this.subcanalService.desasignarVendorDeSubcanal(this.subcanalId, vendorId).subscribe({
        next: () => {
          this.loadSubcanalData();
        },
        error: (err) => {
          console.error('Error al desasignar el vendedor:', err);
          alert('Error al desasignar el vendedor. Intente nuevamente.');
        }
      });
    }
  }

  isVendorAsignando(vendorId: number): boolean {
    return this.vendoresAsignando.has(vendorId);
  }

  // Métodos para operaciones y clientes
  getVendorOperaciones(vendorId: number): number {
    return this.operaciones.filter(op => op.vendedorId === vendorId).length;
  }

  getVendorClientes(vendorId: number): number {
    // Contar clientes asignados a este vendedor
    let count = 0;
    this.clientes.forEach(cliente => {
      if (cliente.vendoresAsignados && cliente.vendoresAsignados.some(v => v.vendedorId === vendorId)) {
        count++;
      }
    });
    return count;
  }

  getVendorNombre(vendorId: number): string {
    const vendor = this.subcanal?.vendors?.find(v => v.id === vendorId);
    return vendor ? `${vendor.nombre} ${vendor.apellido}` : 'Desconocido';
  }

  verDetalleVendor(vendorId: number) {
    this.router.navigate(['/usuarios/vendor', vendorId]);
  }

  verDetalleCliente(clienteId: number) {
    this.router.navigate(['/clientes', clienteId]);
  }

  verDetalleOperacion(operacionId: number) {
    this.router.navigate(['/operaciones', operacionId]);
  }

  filtrarClientes() {
    alert('Funcionalidad de filtrado de clientes en desarrollo');
  }

  filtrarOperaciones() {
    alert('Funcionalidad de filtrado de operaciones en desarrollo');
  }

  // Metodo para cambiar estado del subcanal
  toggleSubcanalEstado() {
    if (!this.subcanal) return;

    // Guardar estado original en caso de error
    const estadoOriginal = this.subcanal.activo;

    // Mostrar indicador de carga
    this.loadingSubcanal = true;

    // Llamar al endpoint correspondiente
    const request = estadoOriginal
      ? this.subcanalService.desactivarSubcanal(this.subcanalId)
      : this.subcanalService.activarSubcanal(this.subcanalId);

    request.subscribe({
      next: () => {
        // En vez de usar la respuesta parcial, recargar el objeto completo
        this.subcanalService.getSubcanal(this.subcanalId).subscribe({
          next: (subcanalCompleto) => {
            // Asegurarnos de mantener la referencia a vendors si no viene en la respuesta
            if (!subcanalCompleto.vendors && this.subcanal && this.subcanal.vendors) {
              subcanalCompleto.vendors = this.subcanal.vendors;
            }

            // Actualizar el objeto completo
            this.subcanal = subcanalCompleto;

            // Recalcular estadísticas
            this.calculateBaseStatistics();

            // Quitar indicador de carga
            this.loadingSubcanal = false;

            // Mostrar mensaje de éxito (opcional)
            console.log(`Subcanal ${this.subcanal.activo ? 'activado' : 'desactivado'} correctamente`);
          },
          error: (err) => {
            // Error al recargar datos
            console.error('Error al recargar datos del subcanal:', err);

            // Revertir al estado original en la UI
            if (this.subcanal) {
              this.subcanal.activo = estadoOriginal;
            }

            // Quitar indicador de carga
            this.loadingSubcanal = false;

            // Mostrar mensaje de error
            this.error = 'Error al actualizar los datos. Por favor, recargue la página.';
          }
        });
      },
      error: (err) => {
        // Error en la operación de activar/desactivar
        console.error('Error al cambiar estado del subcanal:', err);

        // Revertir al estado original en la UI
        if (this.subcanal) {
          this.subcanal.activo = estadoOriginal;
        }

        // Quitar indicador de carga
        this.loadingSubcanal = false;

        // Mostrar mensaje de error
        this.error = 'No se pudo cambiar el estado del subcanal. Intente nuevamente.';
      }
    });
  }

  // Metodos para cambiar estado de vendedores
  toggleVendorEstado(params: { vendorId: number, estadoActual: boolean }) {
    const { vendorId, estadoActual } = params;
    this.loadingVendedores.set(vendorId, true);

    const request = estadoActual
      ? this.usuarioService.desactivarUsuario(vendorId)
      : this.usuarioService.activarUsuario(vendorId);

    request.subscribe({
      next: () => {
        // Obtener el usuario completo actualizado
        this.usuarioService.getUsuario(vendorId).subscribe({
          next: (vendorActualizado) => {
            // Actualizar el vendor en la lista
            if (this.subcanal && this.subcanal.vendors) {
              this.subcanal.vendors = this.subcanal.vendors.map(vendor =>
                vendor.id === vendorId ? vendorActualizado : vendor
              );

              // Actualizar contadores
              this.vendedoresActivos = this.subcanal.vendors.filter(v => v.activo).length;
              this.vendedoresInactivos = this.subcanal.vendors.length - this.vendedoresActivos;
            }

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
}
