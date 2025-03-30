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
    UbicacionSelectorComponent
  ],
  templateUrl: './subcanal-detalle.component.html',
  styleUrls: ['./subcanal-detalle.component.scss']
})
export class SubcanalDetalleComponent implements OnInit, OnDestroy, AfterViewInit {
  subcanalId!: number;
  subcanal: Subcanal | null = null;
  loading = true;
  error: string | null = null;
  activeTab = 'general'; // Default active tab

  // Referencias a los gráficos
  private operacionesChart: Chart | null = null;
  private vendedoresChart: Chart | null = null;
  private montosChart: Chart | null = null;
  private clientesChart: Chart | null = null;

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
    // Esperamos a que los datos estén cargados antes de inicializar los gráficos
    if (!this.loading && this.subcanal) {
      this.initCharts();
    }
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }

    // Destruir gráficos al salir del componente
    this.destroyCharts();
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

  loadSubcanalData() {
    this.loading = true;

    // Obtener el subcanal principal
    this.subcanalService.getSubcanal(this.subcanalId).subscribe({
      next: (subcanal) => {
        this.subcanal = subcanal;
        this.calculateBaseStatistics();

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

        // Inicializar gráficos una vez que los datos estén cargados
        setTimeout(() => {
          this.initCharts();
        }, 200);
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

    // Si cambiamos a la pestaña de estadísticas, inicializamos/actualizamos gráficos
    if (tab === 'estadisticas') {
      setTimeout(() => {
        this.destroyCharts();
        this.initCharts();
      }, 100);
    }
  }

  // Inicializar gráficos
  initCharts() {
    if (this.activeTab !== 'estadisticas') return;

    this.initOperacionesChart();
    this.initVendedoresChart();
    this.initMontosChart();
    this.initClientesChart();
  }

  // Gráfico de operaciones por mes
  initOperacionesChart() {
    const ctx = document.getElementById('operacionesChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Agrupar operaciones por mes
    const operacionesPorMes = this.groupOperacionesPorMes();

    // Destruir el gráfico anterior si existe
    if (this.operacionesChart) {
      this.operacionesChart.destroy();
    }

    this.operacionesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: operacionesPorMes.map(item => item.mes),
        datasets: [{
          label: 'Operaciones',
          data: operacionesPorMes.map(item => item.cantidad),
          backgroundColor: 'rgba(0, 158, 247, 0.2)',
          borderColor: 'rgba(0, 158, 247, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }

  // Gráfico de distribución por vendedores
  initVendedoresChart() {
    const ctx = document.getElementById('vendedoresChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Obtener distribución de operaciones por vendedor
    const distribucionVendedores = this.getDistribucionVendedores();

    // Destruir el gráfico anterior si existe
    if (this.vendedoresChart) {
      this.vendedoresChart.destroy();
    }

    this.vendedoresChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: distribucionVendedores.map(item => item.nombre),
        datasets: [{
          data: distribucionVendedores.map(item => item.operaciones),
          backgroundColor: [
            'rgba(80, 205, 137, 0.7)',
            'rgba(0, 158, 247, 0.7)',
            'rgba(255, 168, 0, 0.7)',
            'rgba(241, 65, 108, 0.7)',
            'rgba(114, 57, 234, 0.7)',
            'rgba(25, 135, 84, 0.7)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  // Gráfico de montos de operaciones por mes
  initMontosChart() {
    const ctx = document.getElementById('montosChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Agrupar montos por mes
    const montosPorMes = this.groupMontosPorMes();

    // Destruir el gráfico anterior si existe
    if (this.montosChart) {
      this.montosChart.destroy();
    }

    this.montosChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: montosPorMes.map(item => item.mes),
        datasets: [{
          label: 'Montos ($)',
          data: montosPorMes.map(item => item.monto),
          backgroundColor: 'rgba(0, 195, 230, 0.7)',
          borderColor: 'rgba(0, 195, 230, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Gráfico de adquisición de clientes por mes
  initClientesChart() {
    const ctx = document.getElementById('clientesChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Agrupar clientes por mes de creación
    const clientesPorMes = this.groupClientesPorMes();

    // Destruir el gráfico anterior si existe
    if (this.clientesChart) {
      this.clientesChart.destroy();
    }

    this.clientesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: clientesPorMes.map(item => item.mes),
        datasets: [{
          label: 'Nuevos Clientes',
          data: clientesPorMes.map(item => item.cantidad),
          backgroundColor: 'rgba(114, 57, 234, 0.2)',
          borderColor: 'rgba(114, 57, 234, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  // Destruir todos los gráficos
  destroyCharts() {
    if (this.operacionesChart) {
      this.operacionesChart.destroy();
      this.operacionesChart = null;
    }
    if (this.vendedoresChart) {
      this.vendedoresChart.destroy();
      this.vendedoresChart = null;
    }
    if (this.montosChart) {
      this.montosChart.destroy();
      this.montosChart = null;
    }
    if (this.clientesChart) {
      this.clientesChart.destroy();
      this.clientesChart = null;
    }
  }

  // Helpers para procesamiento de datos para gráficos
  groupOperacionesPorMes() {
    // Si no hay operaciones, devolver datos de muestra
    if (!this.operaciones || this.operaciones.length === 0) {
      return [
        { mes: 'Ene', cantidad: 0 },
        { mes: 'Feb', cantidad: 0 },
        { mes: 'Mar', cantidad: 0 },
        { mes: 'Abr', cantidad: 0 },
        { mes: 'May', cantidad: 0 },
        { mes: 'Jun', cantidad: 0 }
      ];
    }

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const operacionesPorMes = new Map();

    // Inicializar todos los meses con 0
    meses.forEach(mes => operacionesPorMes.set(mes, 0));

    // Agrupar operaciones por mes
    this.operaciones.forEach(op => {
      if (op.fechaCreacion) {
        const fecha = new Date(op.fechaCreacion);
        const mes = meses[fecha.getMonth()];
        operacionesPorMes.set(mes, (operacionesPorMes.get(mes) || 0) + 1);
      }
    });

    // Convertir el mapa a un array de objetos
    return Array.from(operacionesPorMes.entries())
      .map(([mes, cantidad]) => ({ mes, cantidad }))
      .slice(0, 6); // Mostrar los primeros 6 meses para simplicidad
  }

  getDistribucionVendedores() {
    // Si no hay vendedores, devolver datos de muestra
    if (!this.subcanal || !this.subcanal.vendors || this.subcanal.vendors.length === 0) {
      return [
        { nombre: 'Sin vendedores', operaciones: 1 }
      ];
    }

    // Generar datos basados en los vendedores reales
    return this.subcanal.vendors
      .filter(vendor => vendor.activo)
      .map(vendor => {
        const operacionesCount = this.operaciones.filter(op => op.vendedorId === vendor.id).length;
        const nombreCompleto = `${vendor.nombre} ${vendor.apellido}`;
        return {
          nombre: operacionesCount > 0 ? nombreCompleto : `${nombreCompleto} (0)`,
          operaciones: operacionesCount > 0 ? operacionesCount : 0.1 // Valor mínimo para mostrar en el gráfico
        };
      });
  }

  groupMontosPorMes() {
    // Si no hay operaciones, devolver datos de muestra
    if (!this.operaciones || this.operaciones.length === 0) {
      return [
        { mes: 'Ene', monto: 0 },
        { mes: 'Feb', monto: 0 },
        { mes: 'Mar', monto: 0 },
        { mes: 'Abr', monto: 0 },
        { mes: 'May', monto: 0 },
        { mes: 'Jun', monto: 0 }
      ];
    }

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const montosPorMes = new Map();

    // Inicializar todos los meses con 0
    meses.forEach(mes => montosPorMes.set(mes, 0));

    // Sumar montos por mes
    this.operaciones.forEach(op => {
      if (op.fechaCreacion) {
        const fecha = new Date(op.fechaCreacion);
        const mes = meses[fecha.getMonth()];
        montosPorMes.set(mes, (montosPorMes.get(mes) || 0) + op.monto);
      }
    });

    // Convertir el mapa a un array de objetos
    return Array.from(montosPorMes.entries())
      .map(([mes, monto]) => ({ mes, monto }))
      .slice(0, 6); // Mostrar los primeros 6 meses para simplicidad
  }

  groupClientesPorMes() {
    // Si no hay clientes, devolver datos de muestra
    if (!this.clientes || this.clientes.length === 0) {
      return [
        { mes: 'Ene', cantidad: 0 },
        { mes: 'Feb', cantidad: 0 },
        { mes: 'Mar', cantidad: 0 },
        { mes: 'Abr', cantidad: 0 },
        { mes: 'May', cantidad: 0 },
        { mes: 'Jun', cantidad: 0 }
      ];
    }

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const clientesPorMes = new Map();

    // Inicializar todos los meses con 0
    meses.forEach(mes => clientesPorMes.set(mes, 0));

    // Agrupar clientes por mes de creación
    this.clientes.forEach(cliente => {
      if (cliente.fechaCreacion) {
        const fecha = new Date(cliente.fechaCreacion);
        const mes = meses[fecha.getMonth()];
        clientesPorMes.set(mes, (clientesPorMes.get(mes) || 0) + 1);
      }
    });

    // Convertir el mapa a un array de objetos
    return Array.from(clientesPorMes.entries())
      .map(([mes, cantidad]) => ({ mes, cantidad }))
      .slice(0, 6); // Mostrar los primeros 6 meses para simplicidad
  }

  // Navigate back to subcanales list
  goBack() {
    this.router.navigate(['/subcanales']);
  }

  // Format date string
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  }

  // Get badge class based on active status
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Toggle editing state for sections
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

  updateField(field: string, event: Event) {
    if (this.subcanalFormData) {
      const target = event.target as HTMLInputElement | HTMLSelectElement;

      // Convertir a número si es el campo de comisión
      if (field === 'comision') {
        this.subcanalFormData[field] = parseFloat(target.value);
      } else {
        this.subcanalFormData[field] = target.value;
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

  getTotalGastosClass(): string {
    const total = this.getGastosPorcentaje();
    if (total > 90) return 'text-danger';
    if (total > 70) return 'text-warning';
    return 'text-success';
  }

  getTotalGastosConNuevo(): number {
    const gastosActuales = this.getGastosPorcentaje();
    const nuevoGastoPorcentaje = this.gastoForm.get('porcentaje')?.value || 0;

    // Si estamos editando, restamos el porcentaje original y sumamos el nuevo
    if (this.editingGasto) {
      return gastosActuales - this.editingGasto.porcentaje + nuevoGastoPorcentaje;
    }

    // Si es un nuevo gasto, solo sumamos
    return gastosActuales + nuevoGastoPorcentaje;
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

  guardarGasto() {
    if (this.gastoForm.invalid) {
      this.gastoForm.markAllAsTouched();
      return;
    }

    this.loadingGasto = true;
    const gastoData = this.gastoForm.value;

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
    // Implementar navegación a detalle de vendedor
    this.router.navigate(['/usuarios/vendor', vendorId]);
  }

  verDetalleCliente(clienteId: number) {
    // Implementar navegación a detalle de cliente
    this.router.navigate(['/clientes', clienteId]);
  }

  verDetalleOperacion(operacionId: number) {
    // Implementar navegación a detalle de operación
    this.router.navigate(['/operaciones', operacionId]);
  }

  filtrarClientes() {
    // Implementar filtro de clientes
    alert('Funcionalidad de filtrado de clientes en desarrollo');
  }

  filtrarOperaciones() {
    // Implementar filtro de operaciones
    alert('Funcionalidad de filtrado de operaciones en desarrollo');
  }

  // Metodo para cambiar estado del subcanal
  toggleSubcanalEstado() {
    if (!this.subcanal) return;

    this.loadingSubcanal = true;

    // Determinar qué endpoint llamar según el estado actual
    const request = this.subcanal.activo
      ? this.subcanalService.desactivarSubcanal(this.subcanal.id)
      : this.subcanalService.activarSubcanal(this.subcanal.id);

    request.subscribe({
      next: (subcanalActualizado) => {
        this.subcanal = subcanalActualizado;
        this.loadingSubcanal = false;
      },
      error: (err) => {
        console.error('Error al cambiar estado del subcanal:', err);
        this.error = 'No se pudo cambiar el estado del subcanal. Intente nuevamente.';
        this.loadingSubcanal = false;
      }
    });
  }

  // Metodos para cambiar estado de vendedores
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
