import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { OperacionService, Operacion } from 'src/app/core/services/operacion.service';
import { ModalEditarCanalComponent } from 'src/app/shared/modals/modal-editar-canal/modal-editar-canal.component';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-canal-detalle',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    SidebarComponent,
    ModalEditarCanalComponent
  ],
  templateUrl: './canal-detalle.component.html',
  styleUrls: ['./canal-detalle.component.scss']
})
export class CanalDetalleComponent implements OnInit, OnDestroy, AfterViewInit {
  canalId!: number;
  canal: Canal | null = null;
  loading = true;
  error: string | null = null;
  activeTab = 'general'; // Default active tab

  // Referencias a los gráficos
  private operacionesChart: Chart | null = null;
  private planesChart: Chart | null = null;
  private subcanalesChart: Chart | null = null;
  private vendedoresChart: Chart | null = null;

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private canalService: CanalService,
    private subcanalService: SubcanalService,
    private usuarioService: UsuarioService,
    private operacionService: OperacionService,
    private clienteService: ClienteService,
    private sidebarStateService: SidebarStateService,
    private el: ElementRef
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
    if (!this.loading && this.canal) {
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

  loadCanalData() {
    this.loading = true;

    // Obtener el canal principal
    this.canalService.getCanalDetalles(this.canalId).subscribe({
      next: (canal) => {
        this.canal = canal;
        this.calculateBaseStatistics();

        // Cargar oficiales comerciales
        this.cargarOficialesComerciales(this.canalId);

        // Cargar datos adicionales en paralelo
        this.loadAdditionalData();
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

    // Más estadísticas si es necesario...
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
    this.initPlanesChart();
    this.initSubcanalesChart();
    this.initVendedoresChart();
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
          },
          title: {
            display: false
          }
        }
      }
    });
  }

  // Gráfico de distribución por planes
  initPlanesChart() {
    const ctx = document.getElementById('planesChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Obtener distribución de planes
    const distribucionPlanes = this.getDistribucionPlanes();

    // Destruir el gráfico anterior si existe
    if (this.planesChart) {
      this.planesChart.destroy();
    }

    this.planesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: distribucionPlanes.map(item => item.nombre),
        datasets: [{
          data: distribucionPlanes.map(item => item.operaciones),
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

  // Gráfico de operaciones por subcanal
  initSubcanalesChart() {
    const ctx = document.getElementById('subcanalesChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Obtener operaciones por subcanal
    const operacionesPorSubcanal = this.getOperacionesPorSubcanal();

    // Destruir el gráfico anterior si existe
    if (this.subcanalesChart) {
      this.subcanalesChart.destroy();
    }

    this.subcanalesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: operacionesPorSubcanal.map(item => item.nombre),
        datasets: [{
          label: 'Operaciones',
          data: operacionesPorSubcanal.map(item => item.operaciones),
          backgroundColor: 'rgba(0, 158, 247, 0.7)',
          borderColor: 'rgba(0, 158, 247, 1)',
          borderWidth: 1
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

  // Gráfico de rendimiento de vendedores
  initVendedoresChart() {
    const ctx = document.getElementById('vendedoresChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Obtener rendimiento de vendedores
    const rendimientoVendedores = this.getRendimientoVendedores();

    // Destruir el gráfico anterior si existe
    if (this.vendedoresChart) {
      this.vendedoresChart.destroy();
    }

    this.vendedoresChart = new Chart(ctx, {
      type: 'bar',  // Usar 'bar' en lugar de 'horizontalBar'
      data: {
        labels: rendimientoVendedores.map(item => item.nombre),
        datasets: [{
          label: 'Operaciones',
          data: rendimientoVendedores.map(item => item.operaciones),
          backgroundColor: 'rgba(114, 57, 234, 0.7)',
          borderColor: 'rgba(114, 57, 234, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
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
    if (this.planesChart) {
      this.planesChart.destroy();
      this.planesChart = null;
    }
    if (this.subcanalesChart) {
      this.subcanalesChart.destroy();
      this.subcanalesChart = null;
    }
    if (this.vendedoresChart) {
      this.vendedoresChart.destroy();
      this.vendedoresChart = null;
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

  getDistribucionPlanes() {
    // Si no hay planes, devolver datos de muestra
    if (!this.canal || !this.canal.planesCanal || this.canal.planesCanal.length === 0) {
      return [
        { nombre: 'Plan A', operaciones: 0 },
        { nombre: 'Plan B', operaciones: 0 }
      ];
    }

    // Generar datos basados en los planes reales
    return this.canal.planesCanal
      .filter(planCanal => planCanal.activo)
      .map(planCanal => {
        const operacionesCount = this.operaciones.filter(op => op.planId === planCanal.planId).length;
        return {
          nombre: planCanal.plan.nombre,
          operaciones: operacionesCount
        };
      });
  }

  getOperacionesPorSubcanal() {
    // Si no hay subcanales, devolver datos de muestra
    if (!this.subcanales || this.subcanales.length === 0) {
      return [
        { nombre: 'Subcanal A', operaciones: 0 },
        { nombre: 'Subcanal B', operaciones: 0 }
      ];
    }

    // Generar datos basados en los subcanales reales
    return this.subcanales
      .filter(subcanal => subcanal.activo)
      .map(subcanal => {
        const operacionesCount = this.operaciones.filter(op => op.subcanalId === subcanal.id).length;
        return {
          nombre: subcanal.nombre,
          operaciones: operacionesCount
        };
      });
  }

  getRendimientoVendedores() {
    // Si no hay vendedores, devolver datos de muestra
    if (!this.vendedores || this.vendedores.length === 0) {
      return [
        { nombre: 'Vendedor A', operaciones: 0 },
        { nombre: 'Vendedor B', operaciones: 0 }
      ];
    }

    // Generar datos basados en los vendedores reales
    return this.vendedores
      .map(vendor => {
        const operacionesCount = this.operaciones.filter(op => op.vendedorId === vendor.id).length;
        return {
          nombre: `${vendor.nombre} ${vendor.apellido}`,
          operaciones: operacionesCount
        };
      })
      .sort((a, b) => b.operaciones - a.operaciones) // Ordenar por cantidad de operaciones
      .slice(0, 5); // Mostrar solo los 5 mejores
  }

  // Navigate back to canales list
  goBack() {
    this.router.navigate(['/canales']);
  }

  // Abrir modal para editar canal
  editCanal() {
    this.modalEditarOpen = true;
  }

  // Cerrar modal de edición
  cerrarModalEditar() {
    this.modalEditarOpen = false;
  }

  // Manejar actualización de canal desde el modal
  onCanalActualizado(canal: Canal) {
    this.loadCanalData(); // Recargar todos los datos
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

  // Navigate to subcanal detail
  verDetalleSubcanal(subcanalId: number) {
    this.router.navigate(['/subcanales', subcanalId]);
  }
}
