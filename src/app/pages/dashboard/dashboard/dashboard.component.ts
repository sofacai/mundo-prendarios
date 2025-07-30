import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { AuthService } from 'src/app/core/services/auth.service';
import { OperacionService } from 'src/app/core/services/operacion.service';
import { CanalService } from 'src/app/core/services/canal.service';
import { SubcanalService } from 'src/app/core/services/subcanal.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { PlanService } from 'src/app/core/services/plan.service';
import { RolType } from 'src/app/core/models/usuario.model';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { ReporteOperacionesComponent } from '../repote-operaciones/repote-operaciones.component';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ReporteOperacionesComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardWelcomeComponent implements OnInit {
  private sidebarSubscription: Subscription | null = null;
  mostrarModalReporte = false;
  // User info
  userRole: RolType | null = null;
  userName: string = '';

  // Role type for template
  rolType = RolType;

  // Cargando
  isLoading: boolean = true;

  // Stats generales
  totalOperaciones: number = 0;
  operacionesLiquidadas: number = 0;
  operacionesProcLiq: number = 0;
  operacionesPendientes: number = 0;
  operacionesAprobadas: number = 0;
  montoPromedioPorOperacion: number = 0;
  totalMontosLiquidados: number = 0;
  operacionesDelMesActual: any[] = [];

  // Chart configuration
  chartType: string = 'bar'; // 'bar' or 'line'
  distribucionChartType: string = 'doughnut'; // 'doughnut' or 'bar'
  availableMonths: string[] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  chartStartMonth: number = 0;
  chartEndMonth: number = 5;
  totalOperacionesEnRango: number = 0;
  operacionesLiquidadasEnRango: number = 0;
  operacionesAprobadasEnRango: number = 0;
  operacionesProcLiqEnRango: number = 0;
  distribucionChartColors: string[] = [
    'rgba(0, 158, 247, 0.8)',
    'rgba(80, 205, 137, 0.8)',
    'rgba(255, 199, 0, 0.8)',
    'rgba(241, 65, 108, 0.8)',
    'rgba(114, 57, 234, 0.8)'
  ];
  topEntitiesForDistribution: any[] = [];

  // Lists según rol
  canales: any[] = [];
  subcanales: any[] = [];
  vendors: any[] = [];
  usuarios: any[] = [];
  operaciones: any[] = [];
  planes: any[] = [];

  // Stats específicas de comparación
  canalStats: any[] = [];
  subcanalStats: any[] = [];
  vendorStats: any[] = [];
  adminCanalStats: any[] = [];
  oficialComercialStats: any[] = [];
  planesStats: any[] = [];
  montoPromedioLiquidadas: number = 0;
  montoPromedioBancoLiquidadas: number = 0;
  totalMontoBancoLiquidados: number = 0;

  // Filtros para estadísticas de Top Rendimiento
  topStatsStartMonth: number = 0;
  topStatsEndMonth: number = 11; // Por defecto todo el año

  // Charts
  operacionesChart: Chart | null = null;
  distribucionChart: Chart | null = null;
  comparacionChart: Chart | null = null;

  // Not showing any data condition
  hasData: boolean = false;

  isSidebarCollapsed = false;

  // Data structures for chart metrics
  operacionesPorMes: {
    meses: string[];
    totales: number[];
    liquidadas: number[];
    procLiq: number[];
    aprobadas: number[];
    fullData: { mes: string, total: number, liquidadas: number, procLiq: number, aprobadas: number }[];
  } = { meses: [], totales: [], liquidadas: [], procLiq: [], aprobadas: [], fullData: [] };


  constructor(
    private authService: AuthService,
    private operacionService: OperacionService,
    private canalService: CanalService,
    private subcanalService: SubcanalService,
    private usuarioService: UsuarioService,
    private planService: PlanService,
    private sidebarStateService: SidebarStateService
  ) {}

  ngOnInit(): void {
    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        this.isSidebarCollapsed = collapsed;
        this.adjustContentArea();
      }
    );

    // Obtener el rol y nombre del usuario
    const user = this.authService.currentUserValue;
    if (user) {
      this.userRole = user.rolId;
      this.userName = `${user.nombre} ${user.apellido}`;
    }

    // Inicializar meses disponibles dinámicamente
    this.initializeAvailableMonths();

    // Cargar datos según el rol del usuario
    this.loadDataBasedOnRole();
  }



  initializeAvailableMonths(): void {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Fecha de inicio de la aplicación: Abril 2025
    const mesInicial = 3; // Abril (índice 3)
    const anioInicial = 2025; // Año 2025

    this.availableMonths = [];

    // Si estamos en 2025 (año inicial)
    if (anioActual === anioInicial) {
      // Solo incluir desde abril hasta el mes actual
      for (let mes = mesInicial; mes <= mesActual; mes++) {
        this.availableMonths.push(nombresMeses[mes]);
      }
    }
    // Si estamos en años posteriores
    else {
      // 1. Meses de 2025 (desde abril)
      for (let mes = mesInicial; mes < 12; mes++) {
        this.availableMonths.push(`${nombresMeses[mes]} '25`);
      }

      // 2. Años completos intermedios
      for (let anio = anioInicial + 1; anio < anioActual; anio++) {
        for (let mes = 0; mes < 12; mes++) {
          this.availableMonths.push(`${nombresMeses[mes]} '${anio.toString().slice(-2)}`);
        }
      }

      // 3. Meses del año actual hasta el mes actual
      for (let mes = 0; mes <= mesActual; mes++) {
        this.availableMonths.push(nombresMeses[mes]);
      }
    }

    // Si por alguna razón no hay meses, añadir al menos abril y mayo de 2025
    if (this.availableMonths.length === 0) {
      this.availableMonths.push('Abr');
      this.availableMonths.push('May');
    }

    // Establecer valores por defecto para los filtros
    this.chartStartMonth = 0; // Primer mes disponible (abril 2025)
    this.chartEndMonth = this.availableMonths.length - 1; // Mes actual
  }

  initOperacionesChart(): void {
    const canvas = document.getElementById('operacionesChart');
    if (!canvas) return;

    const ctx = canvas as HTMLCanvasElement;

    // Obtener datos filtrados para el rango seleccionado
    const filteredData = this.getFilteredChartData();

    if (this.operacionesChart) {
      this.operacionesChart.destroy();
    }

    this.operacionesChart = new Chart(ctx, {
      type: this.chartType as any,
      data: {
        labels: filteredData.meses,
        datasets: [
          {
            label: 'Operaciones Ingresadas',
            data: filteredData.totales,
            backgroundColor: 'rgba(0, 158, 247, 0.7)',
            borderColor: 'rgba(0, 158, 247, 1)',
            borderWidth: 2,
            tension: 0.4
          },
          {
            label: 'Operaciones Aprobadas',
            data: filteredData.aprobadas,
            backgroundColor: 'rgba(255, 199, 0, 0.7)',
            borderColor: 'rgba(255, 199, 0, 1)',
            borderWidth: 2,
            tension: 0.4
          },
          {
            label: 'Operaciones Liquidadas',
            data: filteredData.liquidadas,
            backgroundColor: 'rgba(80, 205, 137, 0.7)',
            borderColor: 'rgba(80, 205, 137, 1)',
            borderWidth: 2,
            tension: 0.4
          },
          ...(this.isAdmin() ? [{
            label: 'En Proc. Liq.',
            data: filteredData.procLiq,
            backgroundColor: 'rgba(138, 43, 226, 0.7)',
            borderColor: 'rgba(138, 43, 226, 1)',
            borderWidth: 2,
            tension: 0.4
          }] : [])
        ]
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
          },
          x: {
            // Importante: No hay ajustes adicionales necesarios aquí,
            // ya que ahora los datos de filteredData.meses ya solo contienen
            // los meses correctos (desde abril hacia adelante)
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

  ngAfterViewInit(): void {
    // Los gráficos se inicializarán después de cargar los datos
  }

  private adjustContentArea() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      if (this.isSidebarCollapsed) {
        contentArea.style.marginLeft = '70px';
      } else {
        contentArea.style.marginLeft = '260px';
      }
    }
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }

    if (this.operacionesChart) {
      this.operacionesChart.destroy();
    }

    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }

    if (this.comparacionChart) {
      this.comparacionChart.destroy();
    }
  }

  // Chart type change methods
  changeChartType(type: string): void {
    this.chartType = type;
    this.updateOperacionesChart();
  }

  changeDistribucionChartType(type: string): void {
    this.distribucionChartType = type;
    this.updateDistribucionChart();
  }

  formatLargeNumber(amount: number): string {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    } else {
      return this.formatMoney(amount);
    }
  }

  updateOperacionesChart(): void {
    if (!this.operacionesChart) return;

    // Get data for selected range
    const filteredData = this.getFilteredChartData();

    // Calculate summary stats for the filtered range
    this.totalOperacionesEnRango = filteredData.totales.reduce((sum, value) => sum + value, 0);
    this.operacionesLiquidadasEnRango = filteredData.liquidadas.reduce((sum, value) => sum + value, 0);
    this.operacionesAprobadasEnRango = filteredData.aprobadas.reduce((sum, value) => sum + value, 0);
    this.operacionesProcLiqEnRango = filteredData.procLiq.reduce((sum, value) => sum + value, 0);

    // Recrear el gráfico con el nuevo tipo
    const canvas = this.operacionesChart.canvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Guardar los datos y configuración actuales
    const data = {
      labels: filteredData.meses,
      datasets: [
        {
          label: 'Operaciones Ingresadas',
          data: filteredData.totales,
          backgroundColor: 'rgba(0, 158, 247, 0.7)',
          borderColor: 'rgba(0, 158, 247, 1)',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Operaciones Aprobadas',
          data: filteredData.aprobadas,
          backgroundColor: 'rgba(255, 199, 0, 0.7)',
          borderColor: 'rgba(255, 199, 0, 1)',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Operaciones Liquidadas',
          data: filteredData.liquidadas,
          backgroundColor: 'rgba(80, 205, 137, 0.7)',
          borderColor: 'rgba(80, 205, 137, 1)',
          borderWidth: 2,
          tension: 0.4
        },
        ...(this.isAdmin() ? [{
          label: 'En Proc. Liq.',
          data: filteredData.procLiq,
          backgroundColor: 'rgba(138, 43, 226, 0.7)',
          borderColor: 'rgba(138, 43, 226, 1)',
          borderWidth: 2,
          tension: 0.4
        }] : [])
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        },
        x: {
          // No hay necesidad de ajustar nada aquí, los datos ya vienen filtrados correctamente
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
    };

    // Destruir el gráfico actual
    this.operacionesChart.destroy();

    // Crear un nuevo gráfico con el tipo actualizado
    this.operacionesChart = new Chart(ctx, {
      type: this.chartType as any,
      data: data,
      options: options
    });
  }
     abrirModalReporte() {
    if (this.userRole === RolType.Administrador) {
      this.mostrarModalReporte = true;
    }
  }

  // 5. Método para cerrar el modal de reportes
  cerrarModalReporte() {
    this.mostrarModalReporte = false;
  }

  updateDistribucionChart(): void {
    if (!this.distribucionChart) return;

    // Recrear el gráfico con el nuevo tipo
    const canvas = this.distribucionChart.canvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Obtener los datos actuales
    const data = this.distribucionChart.data;

    // Crear un nuevo objeto de opciones basado en el tipo de gráfico
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: this.distribucionChartType === 'bar' ? 'y' as const : undefined,
      plugins: {
        legend: {
          position: 'right' as const,
          display: this.distribucionChartType === 'doughnut'
        }
      }
    };

    // Destruir el gráfico actual
    this.distribucionChart.destroy();

    // Crear un nuevo gráfico con el tipo actualizado
    this.distribucionChart = new Chart(ctx, {
      type: this.distribucionChartType as any,
      data: data,
      options: options
    });
  }

  // Helper method to get filtered data based on month selection
  getFilteredChartData(): { meses: string[], totales: number[], liquidadas: number[], procLiq: number[], aprobadas: number[] } {
    // Ensure start month is before end month
    const start = Math.min(this.chartStartMonth, this.chartEndMonth);
    const end = Math.max(this.chartStartMonth, this.chartEndMonth);

    // Extract data for the selected range
    const meses = this.operacionesPorMes.meses.slice(start, end + 1);
    const totales = this.operacionesPorMes.totales.slice(start, end + 1);
    const liquidadas = this.operacionesPorMes.liquidadas.slice(start, end + 1);
    const procLiq = this.operacionesPorMes.procLiq.slice(start, end + 1);
    const aprobadas = this.operacionesPorMes.aprobadas.slice(start, end + 1);

    return { meses, totales, liquidadas, procLiq, aprobadas };
  }

  // Percentage calculation helper
  getPorcentajeLiquidado(): string {
    if (this.totalOperacionesEnRango === 0) return "0";
    return ((this.operacionesLiquidadasEnRango / this.totalOperacionesEnRango) * 100).toFixed(1);
  }

  formatPorcentaje(valor: number, total: number): string {
    if (total === 0) return "0";
    return ((valor / total) * 100).toFixed(1);
  }

  loadDataBasedOnRole(): void {
    if (!this.userRole) return;

    this.isLoading = true;

    switch (this.userRole) {
      case RolType.Administrador:
        this.loadAdminData();
        break;
      case RolType.OficialComercial:
        this.loadOficialComercialData();
        break;
      case RolType.AdminCanal:
        this.loadAdminCanalData();
        break;
      case RolType.Vendor:
        this.loadVendorData();
        break;
      default:
        this.isLoading = false;
        break;
    }
  }

  loadAdminData(): void {
    // Cargar todos los datos para el administrador
    forkJoin({
      operaciones: this.operacionService.getOperaciones().pipe(catchError(() => of([]))),
      canales: this.canalService.getCanales().pipe(catchError(() => of([]))),
      planes: this.planService.getPlanes().pipe(catchError(() => of([]))),
      usuarios: this.usuarioService.getUsuarios().pipe(catchError(() => of([])))
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.processData();
        this.initializeCharts();
      })
    ).subscribe(result => {
      this.operaciones = result.operaciones;
      this.canales = result.canales;
      this.planes = result.planes;
      this.usuarios = result.usuarios;

      // Check if we have any data to show
      this.hasData = this.operaciones.length > 0;

      // Procesar datos para estadísticas
      this.calculateGeneralStats();
      this.calculateRoleSpecificStats();
    });
  }

  loadOficialComercialData(): void {
    // Get usuario ID
    const userId = this.authService.getUsuarioId();

    // Cargar datos para oficial comercial (solo canales asignados)
    // Aquí habría que adaptar para obtener solo los canales asignados al oficial
    forkJoin({
      operaciones: this.operacionService.getOperaciones().pipe(catchError(() => of([]))),
      canales: this.canalService.getCanales().pipe(catchError(() => of([]))),
      usuarios: this.usuarioService.getUsuarios().pipe(catchError(() => of([])))
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.processData();
        this.initializeCharts();
      })
    ).subscribe(result => {
      // Filtrar solo operaciones de canales asignados al oficial comercial
      // Esto es un ejemplo, la lógica actual puede variar según cómo se asignen canales a oficiales
      this.operaciones = result.operaciones;

      // Supongamos que hay una forma de determinar si un canal está asignado a este oficial comercial
      // En un sistema real, esto sería una relación en la base de datos
      this.canales = result.canales;
      this.usuarios = result.usuarios.filter(u => u.rolId === RolType.Vendor || u.rolId === RolType.AdminCanal);

      // Check if we have any data to show
      this.hasData = this.operaciones.length > 0;

      this.calculateGeneralStats();
      this.calculateRoleSpecificStats();
    });
  }

  loadAdminCanalData(): void {
    // Get usuario ID
    const userId = this.authService.getUsuarioId();

    // Cargar datos para admin canal (solo subcanales asignados)
    forkJoin({
      operaciones: this.operacionService.getOperaciones().pipe(catchError(() => of([]))),
      subcanales: this.subcanalService.getSubcanalesPorUsuario(userId).pipe(catchError(() => of([]))),
      vendors: this.usuarioService.getUsuariosPorRol(RolType.Vendor).pipe(catchError(() => of([])))
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.processData();
        this.initializeCharts();
      })
    ).subscribe(result => {
      this.subcanales = result.subcanales;

      // Filtrar operaciones solo para los subcanales asignados
      const subcanalIds = this.subcanales.map(s => s.id);
      this.operaciones = result.operaciones.filter(op => subcanalIds.includes(op.subcanalId));

      // Filtrar vendors solo para estos subcanales
      // Esto es simplificado, normalmente necesitarías una relación vendor-subcanal
      this.vendors = result.vendors;

      // Check if we have any data to show
      this.hasData = this.operaciones.length > 0;

      this.calculateGeneralStats();
      this.calculateRoleSpecificStats();
    });
  }

  loadVendorData(): void {
    // Get usuario ID
    const userId = this.authService.getUsuarioId();

    // Cargar datos para vendor (solo sus operaciones)
    this.operacionService.getOperaciones().pipe(
      catchError(() => of([])),
      finalize(() => {
        this.isLoading = false;
        this.processData();
        this.initializeCharts();
      })
    ).subscribe(operaciones => {
      // Filtrar solo las operaciones de este vendor
      this.operaciones = operaciones.filter(op => op.vendedorId === userId);

      // Check if we have any data to show
      this.hasData = this.operaciones.length > 0;

      this.calculateGeneralStats();
    });
  }

  updateTopStats(): void {
    // Validar que el mes de inicio no sea mayor que el de fin
    if (this.topStatsStartMonth > this.topStatsEndMonth) {
      this.topStatsEndMonth = this.topStatsStartMonth;
    }

    // Recalcular estadísticas específicas del rol
    this.calculateRoleSpecificStats();
  }

  calculateGeneralStats(): void {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();

    // 1. Op. Ingresadas: TODAS las operaciones que ingresaron en el mes (sin importar estado actual)
    const operacionesIngresas = this.operaciones.filter(op => {
      if (op.fechaCreacion) {
        const fecha = new Date(op.fechaCreacion);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
      }
      return false;
    });
    this.totalOperaciones = operacionesIngresas.length;

    // 2. Op. Aprobadas: estadoDashboard = 'APROBADA' con fechaCreacion del mes actual
    const operacionesAprobadasDelMes = this.operaciones.filter(op => {
      if (op.estadoDashboard === 'APROBADA' && op.fechaCreacion) {
        const fecha = new Date(op.fechaCreacion);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
      }
      return false;
    });
    this.operacionesAprobadas = operacionesAprobadasDelMes.length;

    // 3. Op. Liquidadas: estadoDashboard = 'LIQUIDADA' con fechaLiquidacion del mes actual
    const operacionesLiquidadasDelMes = this.operaciones.filter(op => {
      if (op.estadoDashboard === 'LIQUIDADA' && op.fechaLiquidacion) {
        const fecha = new Date(op.fechaLiquidacion);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
      }
      return false;
    });
    this.operacionesLiquidadas = operacionesLiquidadasDelMes.length;

    // 3.1 Op. en Proceso de Liquidación: estadoDashboard = 'EN PROC LIQ' con fechaProcLiq del mes actual
    const operacionesProcLiqDelMes = this.operaciones.filter(op => {
      if (op.estadoDashboard === 'EN PROC LIQ' && op.fechaProcLiq) {
        const fecha = new Date(op.fechaProcLiq);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
      }
      return false;
    });
    this.operacionesProcLiq = operacionesProcLiqDelMes.length;

    // 4. Monto total Canal: suma total de montoAprobado de las liquidadas del mes (NO incluye proc liq)
    this.totalMontosLiquidados = operacionesLiquidadasDelMes.reduce((sum, op) => {
      const monto = op.montoAprobado || 0;
      return sum + monto;
    }, 0);

    // Monto promedio de operaciones liquidadas del mes para la caja de canal
    this.montoPromedioLiquidadas = operacionesLiquidadasDelMes.length > 0 ?
      this.totalMontosLiquidados / operacionesLiquidadasDelMes.length : 0;

    // 5. Total y promedio de montoAprobadoBanco: incluye liquidadas + proc liq del mes
    const todasOperacionesParaBanco = [...operacionesLiquidadasDelMes, ...operacionesProcLiqDelMes];
    this.totalMontoBancoLiquidados = todasOperacionesParaBanco.reduce((sum, op) => {
      const monto = op.montoAprobadoBanco || 0;
      return sum + monto;
    }, 0);
    this.montoPromedioBancoLiquidadas = todasOperacionesParaBanco.length > 0 ?
      this.totalMontoBancoLiquidados / todasOperacionesParaBanco.length : 0;

    // Mantener para compatibilidad - operaciones del mes actual por fechaCreacion
    this.operacionesDelMesActual = operacionesIngresas;

    // Monto promedio por operación (todas las ingresadas del mes)
    const totalMonto = this.operacionesDelMesActual.reduce((sum, op) => sum + (op.monto || 0), 0);
    this.montoPromedioPorOperacion = this.operacionesDelMesActual.length > 0 ?
      totalMonto / this.operacionesDelMesActual.length : 0;
  }

  // Método auxiliar para filtrar operaciones por fechas específicas en un rango
  private isOperacionInDateRange(operacion: any, fechaField: string, startMonth: number, endMonth: number): boolean {
    if (!operacion[fechaField]) return false;

    const fecha = new Date(operacion[fechaField]);
    const mesOperacion = fecha.getMonth();

    // Si el rango no cruza el año, comparación simple
    if (startMonth <= endMonth) {
      return mesOperacion >= startMonth && mesOperacion <= endMonth;
    } else {
      // Si cruza el año (ej: de Oct a Mar)
      return mesOperacion >= startMonth || mesOperacion <= endMonth;
    }
  }

  // Método auxiliar para filtrar operaciones liquidadas en rango
  private filterOperacionesLiquidadasInRange(operaciones: any[]): any[] {
    return operaciones.filter(op =>
      this.isOperacionInDateRange(op, 'fechaLiquidacion', this.topStatsStartMonth, this.topStatsEndMonth)
    );
  }

  // Método auxiliar para filtrar operaciones aprobadas en rango
  private filterOperacionesAprobadasInRange(operaciones: any[]): any[] {
    return operaciones.filter(op =>
      this.isOperacionInDateRange(op, 'fechaAprobacion', this.topStatsStartMonth, this.topStatsEndMonth)
    );
  }

  calculateRoleSpecificStats(): void {
    if (!this.userRole) return;

    switch (this.userRole) {
      case RolType.Administrador:
        this.calculateAdminSpecificStats();
        break;
      case RolType.OficialComercial:
        this.calculateOficialComercialSpecificStats();
        break;
      case RolType.AdminCanal:
        this.calculateAdminCanalSpecificStats();
        break;
      case RolType.Vendor:
        // No additional stats for vendor
        break;
    }
  }

  calculateAdminSpecificStats(): void {
    // Estadísticas por canal (usando fechas específicas para el filtro)
    this.canalStats = this.canales.map(canal => {
      const operacionesCanal = this.operaciones.filter(op => op.canalId === canal.id);
      const operacionesLiquidadas = this.filterOperacionesLiquidadasInRange(operacionesCanal);

      return {
        nombre: canal.nombreFantasia,
        totalOperaciones: operacionesCanal.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesCanal.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => {
          // Usar montoAprobado si existe, sino monto original
          const monto = op.montoAprobado || op.monto || 0;
          return total + monto;
        }, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);

    // Estadísticas por plan (usando fechas específicas)
    this.planesStats = this.planes.map(plan => {
      const operacionesPlan = this.operaciones.filter(op => op.planId === plan.id);
      const operacionesLiquidadas = this.filterOperacionesLiquidadasInRange(operacionesPlan);

      return {
        nombre: plan.nombre,
        totalOperaciones: operacionesPlan.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesPlan.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => {
          const monto = op.montoAprobado || op.monto || 0;
          return total + monto;
        }, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);

    // Estadísticas por tipo de usuario
    const adminCanales = this.usuarios.filter(u => u.rolId === RolType.AdminCanal);
    const oficialComerciales = this.usuarios.filter(u => u.rolId === RolType.OficialComercial);
    const vendors = this.usuarios.filter(u => u.rolId === RolType.Vendor);

    // Admin Canal stats
    this.adminCanalStats = adminCanales.map(admin => {
      // Supongamos que podemos identificar subcanales asociados a este admin
      // Esto es una simplificación, la lógica real dependerá de tu modelo de datos
      const operacionesAdmin = this.operaciones.filter(op => {
        // Simplificación para ejemplo
        return op.adminCanalId === admin.id;
      });

      const operacionesLiquidadas = operacionesAdmin.filter(op => op.estadoDashboard === 'LIQUIDADA');

      return {
        nombre: `${admin.nombre} ${admin.apellido}`,
        totalOperaciones: operacionesAdmin.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesAdmin.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);

    // Vendor stats
    this.vendorStats = vendors.map(vendor => {
      const operacionesVendor = this.operaciones.filter(op => op.vendedorId === vendor.id);
      const operacionesLiquidadas = operacionesVendor.filter(op => op.estadoDashboard === 'LIQUIDADA');

      return {
        nombre: `${vendor.nombre} ${vendor.apellido}`,
        totalOperaciones: operacionesVendor.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesVendor.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);

    // Oficial comercial stats
    this.oficialComercialStats = oficialComerciales.map(oficial => {
      // De forma similar, simplificado
      const operacionesOficial = this.operaciones.filter(op => {
        // Simplificación
        return op.oficialComercialId === oficial.id;
      });

      const operacionesLiquidadas = operacionesOficial.filter(op => op.estadoDashboard === 'LIQUIDADA');

      return {
        nombre: `${oficial.nombre} ${oficial.apellido}`,
        totalOperaciones: operacionesOficial.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesOficial.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);
  }

  calculateOficialComercialSpecificStats(): void {
    // Similar al admin pero solo para canales asignados
    // Estadísticas por canal
    this.canalStats = this.canales.map(canal => {
      const operacionesCanal = this.operaciones.filter(op => op.canalId === canal.id);
      const operacionesLiquidadas = operacionesCanal.filter(op => op.estadoDashboard === 'LIQUIDADA');

      return {
        nombre: canal.nombreFantasia,
        totalOperaciones: operacionesCanal.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesCanal.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);

    // Estadísticas de admin canales bajo su gestión
    this.adminCanalStats = this.usuarios
      .filter(u => u.rolId === RolType.AdminCanal)
      .map(admin => {
        // Simplificado
        const operacionesAdmin = this.operaciones.filter(op => {
          // Asumiendo que hay una forma de relacionar operaciones con este admin canal
          return op.adminCanalId === admin.id;
        });

        const operacionesLiquidadas = operacionesAdmin.filter(op => op.estadoDashboard === 'LIQUIDADA');

        return {
          nombre: `${admin.nombre} ${admin.apellido}`,
          totalOperaciones: operacionesAdmin.length,
          operacionesLiquidadas: operacionesLiquidadas.length,
          montoTotal: operacionesAdmin.reduce((total, op) => total + op.monto, 0),
          montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
        };
      }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);

    // Estadísticas de vendors
    this.vendorStats = this.usuarios
      .filter(u => u.rolId === RolType.Vendor)
      .map(vendor => {
        const operacionesVendor = this.operaciones.filter(op => op.vendedorId === vendor.id);
        const operacionesLiquidadas = operacionesVendor.filter(op => op.estadoDashboard === 'LIQUIDADA');

        return {
          nombre: `${vendor.nombre} ${vendor.apellido}`,
          totalOperaciones: operacionesVendor.length,
          operacionesLiquidadas: operacionesLiquidadas.length,
          montoTotal: operacionesVendor.reduce((total, op) => total + op.monto, 0),
          montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
        };
      }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);
  }

  calculateAdminCanalSpecificStats(): void {
    // Estadísticas por subcanal
    this.subcanalStats = this.subcanales.map(subcanal => {
      const operacionesSubcanal = this.operaciones.filter(op => op.subcanalId === subcanal.id);
      const operacionesLiquidadas = operacionesSubcanal.filter(op => op.estadoDashboard === 'LIQUIDADA');

      return {
        nombre: subcanal.nombre,
        totalOperaciones: operacionesSubcanal.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesSubcanal.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);

    // Estadísticas de vendors en estos subcanales
    this.vendorStats = this.vendors.map(vendor => {
      const operacionesVendor = this.operaciones.filter(op => op.vendedorId === vendor.id);
      const operacionesLiquidadas = operacionesVendor.filter(op => op.estadoDashboard === 'LIQUIDADA');

      return {
        nombre: `${vendor.nombre} ${vendor.apellido}`,
        totalOperaciones: operacionesVendor.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesVendor.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);
  }

  processData(): void {
    // Agrupar operaciones por mes y preparar datos para gráficos
    const operacionesPorMesData = this.groupOperacionesPorMes();
    this.operacionesPorMes = operacionesPorMesData;

    // Calcular total y operaciones liquidadas en el rango seleccionado
    this.totalOperacionesEnRango = operacionesPorMesData.totales.slice(this.chartStartMonth, this.chartEndMonth + 1)
      .reduce((sum, value) => sum + value, 0);
    this.operacionesLiquidadasEnRango = operacionesPorMesData.liquidadas.slice(this.chartStartMonth, this.chartEndMonth + 1)
      .reduce((sum, value) => sum + value, 0);
    this.operacionesAprobadasEnRango = operacionesPorMesData.aprobadas.slice(this.chartStartMonth, this.chartEndMonth + 1)
      .reduce((sum, value) => sum + value, 0);
    this.operacionesProcLiqEnRango = operacionesPorMesData.procLiq.slice(this.chartStartMonth, this.chartEndMonth + 1)
      .reduce((sum, value) => sum + value, 0);

    // Preparar datos para el gráfico de distribución
    this.prepareDistributionData();
  }

  prepareDistributionData(): void {
    // Configurar datos de entidades principales según el rol para el gráfico de distribución
    if (this.userRole === RolType.Administrador) {
      this.topEntitiesForDistribution = this.canalStats.slice(0, 5);
    } else if (this.userRole === RolType.OficialComercial) {
      this.topEntitiesForDistribution = this.canalStats.slice(0, 5);
    } else if (this.userRole === RolType.AdminCanal) {
      this.topEntitiesForDistribution = this.subcanalStats.slice(0, 5);
    } else {
      // Para Vendor, mostrar por estado dashboard
      const operacionesPorEstado: Map<string, number> = new Map();
      this.operaciones.forEach(op => {
        const estado = op.estadoDashboard || 'Sin estado';
        operacionesPorEstado.set(estado, (operacionesPorEstado.get(estado) || 0) + 1);
      });

      this.topEntitiesForDistribution = Array.from(operacionesPorEstado.entries())
        .map(([nombre, totalOperaciones]) => ({ nombre, totalOperaciones }))
        .sort((a, b) => b.totalOperaciones - a.totalOperaciones);
    }
  }

  initializeCharts(): void {
    // Solo inicializar gráficos si hay datos
    if (this.hasData) {
      setTimeout(() => {
        this.initOperacionesChart();
        this.initDistribucionChart();
      }, 300);
    }
  }



  initDistribucionChart(): void {
    const canvas = document.getElementById('distribucionChart');
    if (!canvas) return;

    const ctx = canvas as HTMLCanvasElement;

    // Preparar datos para el gráfico de distribución
    const labels = this.topEntitiesForDistribution.map(item => item.nombre);
    const data = this.topEntitiesForDistribution.map(item => item.totalOperaciones);

    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }

    this.distribucionChart = new Chart(ctx, {
      type: this.distribucionChartType as any,
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: this.distribucionChartColors,
          borderColor: this.distribucionChartColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: this.distribucionChartType === 'bar' ? 'y' : undefined,
        plugins: {
          legend: {
            position: 'right',
            display: this.distribucionChartType === 'doughnut'
          }
        }
      }
    });
  }

  groupOperacionesPorMes(): {meses: string[], totales: number[], liquidadas: number[], procLiq: number[], aprobadas: number[], fullData: any[]} {
    // Arreglo con todos los meses
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    const mesInicial = 3; // Abril (índice 3)
    const anioInicial = 2025;

    const mesesMostrados: string[] = [];
    const totales: number[] = [];
    const liquidadas: number[] = [];
    const procLiq: number[] = [];
    const aprobadas: number[] = [];
    const fullData: any[] = [];

    // Helper para contar operaciones por mes y año usando estadoDashboard
    const contarPorMesConEstado = (estadoDashboard: string, campoFecha: string, mes: number, anio: number) => {
      return this.operaciones.filter(op => {
        if (op.estadoDashboard !== estadoDashboard) return false;
        if (!op[campoFecha]) return false;
        const fecha = new Date(op[campoFecha]);
        return fecha.getMonth() === mes && fecha.getFullYear() === anio;
      }).length;
    };

    // Helper function to count operations by month and year for a given date field
    function contarPorMes(operaciones: any[], campoFecha: string, mes: number, anio: number): number {
      return operaciones.filter(op => {
        if (!op[campoFecha]) return false;
        const fecha = new Date(op[campoFecha]);
        return fecha.getMonth() === mes && fecha.getFullYear() === anio;
      }).length;
    }

    // Generar datos solo para los meses entre abril 2025 y el mes actual
    if (anioActual === anioInicial) {
      for (let mes = mesInicial; mes <= mesActual; mes++) {
        const etiquetaMes = nombresMeses[mes];
        const totalOperaciones = contarPorMes(this.operaciones, 'fechaCreacion', mes, anioActual);
        const operacionesLiquidadas = contarPorMesConEstado('LIQUIDADA', 'fechaLiquidacion', mes, anioActual);
        const operacionesProcLiq = contarPorMesConEstado('EN PROC LIQ', 'fechaProcLiq', mes, anioActual);
        const operacionesAprobadas = contarPorMesConEstado('APROBADA', 'fechaCreacion', mes, anioActual);
        mesesMostrados.push(etiquetaMes);
        totales.push(totalOperaciones);
        liquidadas.push(operacionesLiquidadas);
        procLiq.push(operacionesProcLiq);
        aprobadas.push(operacionesAprobadas);
        fullData.push({
          mes: etiquetaMes,
          total: totalOperaciones,
          liquidadas: operacionesLiquidadas,
          procLiq: operacionesProcLiq,
          aprobadas: operacionesAprobadas
        });
      }
    } else {
      // 1. Meses de 2025 (desde abril)
      for (let mes = mesInicial; mes < 12; mes++) {
        const etiquetaMes = `${nombresMeses[mes]} '25`;
        const totalOperaciones = contarPorMes(this.operaciones, 'fechaCreacion', mes, anioInicial);
        const operacionesLiquidadas = contarPorMes(this.operaciones, 'fechaLiquidacion', mes, anioInicial);
        const operacionesAprobadas = contarPorMes(this.operaciones, 'fechaAprobacion', mes, anioInicial);
        mesesMostrados.push(etiquetaMes);
        totales.push(totalOperaciones);
        liquidadas.push(operacionesLiquidadas);
        aprobadas.push(operacionesAprobadas);
        fullData.push({
          mes: etiquetaMes,
          total: totalOperaciones,
          liquidadas: operacionesLiquidadas,
          aprobadas: operacionesAprobadas
        });
      }
      // 2. Años completos intermedios
      for (let anio = anioInicial + 1; anio < anioActual; anio++) {
        for (let mes = 0; mes < 12; mes++) {
          const etiquetaMes = `${nombresMeses[mes]} '${anio.toString().slice(-2)}`;
          const totalOperaciones = contarPorMes(this.operaciones, 'fechaCreacion', mes, anio);
          const operacionesLiquidadas = contarPorMes(this.operaciones, 'fechaLiquidacion', mes, anio);
          const operacionesAprobadas = contarPorMes(this.operaciones, 'fechaAprobacion', mes, anio);
          mesesMostrados.push(etiquetaMes);
          totales.push(totalOperaciones);
          liquidadas.push(operacionesLiquidadas);
          aprobadas.push(operacionesAprobadas);
          fullData.push({
            mes: etiquetaMes,
            total: totalOperaciones,
            liquidadas: operacionesLiquidadas,
            aprobadas: operacionesAprobadas
          });
        }
      }
      // 3. Meses del año actual hasta el mes actual
      for (let mes = 0; mes <= mesActual; mes++) {
        const etiquetaMes = nombresMeses[mes];
        const totalOperaciones = contarPorMes(this.operaciones, 'fechaCreacion', mes, anioActual);
        const operacionesLiquidadas = contarPorMesConEstado('LIQUIDADA', 'fechaLiquidacion', mes, anioActual);
        const operacionesProcLiq = contarPorMesConEstado('EN PROC LIQ', 'fechaProcLiq', mes, anioActual);
        const operacionesAprobadas = contarPorMesConEstado('APROBADA', 'fechaCreacion', mes, anioActual);
        mesesMostrados.push(etiquetaMes);
        totales.push(totalOperaciones);
        liquidadas.push(operacionesLiquidadas);
        procLiq.push(operacionesProcLiq);
        aprobadas.push(operacionesAprobadas);
        fullData.push({
          mes: etiquetaMes,
          total: totalOperaciones,
          liquidadas: operacionesLiquidadas,
          procLiq: operacionesProcLiq,
          aprobadas: operacionesAprobadas
        });
      }
    }

    // Si no hay datos, asegurar que al menos tengamos abril y mayo del año actual
    if (mesesMostrados.length === 0) {
      if (anioActual === anioInicial) {
        for (let mes = mesInicial; mes <= mesActual; mes++) {
          mesesMostrados.push(nombresMeses[mes]);
          totales.push(0);
          liquidadas.push(0);
          aprobadas.push(0);
          fullData.push({
            mes: nombresMeses[mes],
            total: 0,
            liquidadas: 0,
            aprobadas: 0
          });
        }
      } else {
        for (let mes = mesInicial; mes < 12; mes++) {
          const etiquetaMes = `${nombresMeses[mes]} '25`;
          mesesMostrados.push(etiquetaMes);
          totales.push(0);
          liquidadas.push(0);
          aprobadas.push(0);
          fullData.push({
            mes: etiquetaMes,
            total: 0,
            liquidadas: 0,
            aprobadas: 0
          });
        }
        for (let anio = anioInicial + 1; anio < anioActual; anio++) {
          for (let mes = 0; mes < 12; mes++) {
            const etiquetaMes = `${nombresMeses[mes]} '${anio.toString().slice(-2)}`;
            mesesMostrados.push(etiquetaMes);
            totales.push(0);
            liquidadas.push(0);
            aprobadas.push(0);
            fullData.push({
              mes: etiquetaMes,
              total: 0,
              liquidadas: 0,
              aprobadas: 0
            });
          }
        }
        for (let mes = 0; mes <= mesActual; mes++) {
          mesesMostrados.push(nombresMeses[mes]);
          totales.push(0);
          liquidadas.push(0);
          aprobadas.push(0);
          fullData.push({
            mes: nombresMeses[mes],
            total: 0,
            liquidadas: 0,
            aprobadas: 0
          });
        }
      }
    }

    return { meses: mesesMostrados, totales, liquidadas, procLiq, aprobadas, fullData };
  }

  agruparOperacionesPorMes(operaciones: any[]): { [key: string]: any[] } {
    const result: { [key: string]: any[] } = {};

    operaciones.forEach(op => {
      if (op.fechaCreacion) {
        const fecha = new Date(op.fechaCreacion);
        const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(op);
      }
    });

    return result;
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTopItems(items: any[], count: number = 5): any[] {
    return items.slice(0, count);
  }

  getChartLabel(): string {
    switch(this.userRole) {
      case RolType.Administrador:
        return 'Top Canales';
      case RolType.OficialComercial:
        return 'Top Canales';
      case RolType.AdminCanal:
        return 'Top Subcanales';
      case RolType.Vendor:
        return 'Por Estado';
      default:
        return 'Distribución';
    }
  }

  isAdmin(): boolean {
    return this.userRole === RolType.Administrador;
  }
}
