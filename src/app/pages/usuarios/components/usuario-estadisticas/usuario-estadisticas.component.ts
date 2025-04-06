import { Component, OnInit, OnChanges, Input, ElementRef, ViewChild, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { UsuarioDto, VendorEstadisticasDto } from 'src/app/core/services/usuario.service';
import { Operacion } from 'src/app/core/services/operacion.service';
import { Cliente } from 'src/app/core/services/cliente.service';
import { Canal } from 'src/app/core/services/canal.service';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { RolType } from 'src/app/core/models/usuario.model';

Chart.register(...registerables);

@Component({
  selector: 'app-usuario-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-estadisticas.component.html',
  styleUrls: ['./usuario-estadisticas.component.scss']
})
export class UsuarioEstadisticasComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() usuario!: UsuarioDto;
  @Input() estadisticas: VendorEstadisticasDto | null = null;
  @Input() operaciones: Operacion[] = [];
  @Input() clientes: Cliente[] = [];
  @Input() canales: Canal[] = [];
  @Input() subcanales: Subcanal[] = [];
  @Input() vendors: UsuarioDto[] = [];

  @ViewChild('operacionesPorMesChart') operacionesPorMesChartRef!: ElementRef;
  @ViewChild('canalesOperacionesChart') canalesOperacionesChartRef!: ElementRef;
  @ViewChild('vendorsOperacionesChart') vendorsOperacionesChartRef!: ElementRef;

  // Propiedades calculadas
  operacionesActivas: number = 0;
  montoTotal: number = 0;
  montoPromedio: number = 0;
  promedioMensual: number = 0;
  clientesNuevosMes: number = 0;
  ultimasOperaciones: Operacion[] = [];
  hasSufficientData: boolean = false;
  chartInitialized: boolean = false;

  // Tendencias (en porcentaje, + o -)
  trendMensual: number = 0;
  trendMonto: number = 0;
  trendClientes: number = 0;

  // Datos específicos por rol
  canalMasActivo: string = '';
  subcanalMasActivo: string = '';
  vendorMasActivo: string = '';
  operacionesPorCanal: {[key: string]: number} = {};
  operacionesPorSubcanal: {[key: string]: number} = {};
  operacionesPorVendor: {[key: string]: number} = {};

  // Instancias de gráficos
  private operacionesChart: Chart | null = null;
  private canalesChart: Chart | null = null;
  private vendorsChart: Chart | null = null;

  constructor() { }

  ngOnInit() {
    console.log('UsuarioEstadisticasComponent - ngOnInit');
    console.log('Usuario:', this.usuario);
    console.log('Operaciones:', this.operaciones.length);
    console.log('Clientes:', this.clientes.length);
    console.log('Canales:', this.canales.length);
    console.log('Subcanales:', this.subcanales.length);
    console.log('Vendors:', this.vendors.length);

    this.calcularEstadisticas();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('UsuarioEstadisticasComponent - ngOnChanges');
    if (changes['operaciones'] || changes['clientes'] || changes['canales'] || changes['subcanales'] || changes['vendors']) {
      this.calcularEstadisticas();
      if (this.chartInitialized) {
        this.updateChartData();
      }
    }
  }

  ngAfterViewInit() {
    console.log('UsuarioEstadisticasComponent - ngAfterViewInit');
    // Usar setTimeout para asegurar que los elementos del DOM estén listos
    setTimeout(() => {
      this.initializeCharts();
    }, 300);
  }

  initializeCharts() {
    console.log('UsuarioEstadisticasComponent - initializeCharts');
    this.inicializarGraficoOperaciones();

    // Inicializar gráficos según el rol del usuario
    if (this.usuario.rolId === RolType.AdminCanal) {
      this.inicializarGraficoSubcanales();
    } else if (this.usuario.rolId === RolType.OficialComercial) {
      this.inicializarGraficoCanales();
    }

    // El gráfico de vendors se muestra para AdminCanal y OficialComercial
    if (this.usuario.rolId === RolType.AdminCanal || this.usuario.rolId === RolType.OficialComercial) {
      this.inicializarGraficoVendors();
    }

    this.chartInitialized = true;
  }

  calcularEstadisticas() {
    console.log('UsuarioEstadisticasComponent - calcularEstadisticas');
    // Estadísticas generales
    this.calcularOperacionesActivas();
    this.calcularMontoTotal();
    this.calcularMontoPromedio();
    this.calcularPromedioMensual();
    this.calcularTendencias();
    this.calcularClientesNuevosMes();
    this.obtenerUltimasOperaciones();

    // Estadísticas específicas por rol
    if (this.usuario.rolId === RolType.AdminCanal) {
      this.calcularEstadisticasSubcanales();
      this.calcularEstadisticasVendors();
    } else if (this.usuario.rolId === RolType.OficialComercial) {
      this.calcularEstadisticasCanales();
      this.calcularEstadisticasVendors();
    }
  }

  calcularOperacionesActivas() {
    this.operacionesActivas = this.operaciones.filter(op =>
      !op.estado ||
      (op.estado.toLowerCase() !== 'cancelado' &&
       op.estado.toLowerCase() !== 'rechazado')
    ).length;
  }

  calcularMontoTotal() {
    this.montoTotal = this.operaciones.reduce((sum, op) => sum + op.monto, 0);
  }

  calcularMontoPromedio() {
    this.montoPromedio = this.operaciones.length > 0
      ? this.montoTotal / this.operaciones.length
      : 0;
  }

  calcularPromedioMensual() {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const operacionesUltimoAnio = this.operaciones.filter(op => {
      const fechaOp = op.fechaCreacion ? new Date(op.fechaCreacion) : null;
      return fechaOp && fechaOp >= oneYearAgo;
    });

    const operacionesPorMes = this.agruparOperacionesPorMes(operacionesUltimoAnio);
    const meses = Object.keys(operacionesPorMes).length || 1;
    this.promedioMensual = Math.round(operacionesUltimoAnio.length / meses * 10) / 10;

    this.hasSufficientData = Object.keys(operacionesPorMes).length >= 2;
  }

  calcularTendencias() {
    console.log('UsuarioEstadisticasComponent - calcularTendencias');
    const operacionesPorMes = this.agruparOperacionesPorMes(this.operaciones);
    this.trendMensual = this.calcularTendenciaMensual(operacionesPorMes);
    this.trendMonto = this.calcularTendenciaMonto();
    this.trendClientes = this.calcularTendenciaClientes();
  }

  calcularClientesNuevosMes() {
    const hoy = new Date();
    const unMesAtras = new Date();
    unMesAtras.setMonth(hoy.getMonth() - 1);

    this.clientesNuevosMes = this.clientes.filter(cliente => {
      if (!cliente.fechaCreacion) return false;
      const fechaCliente = new Date(cliente.fechaCreacion);
      return fechaCliente >= unMesAtras && fechaCliente <= hoy;
    }).length;
  }

  obtenerUltimasOperaciones() {
    this.ultimasOperaciones = [...this.operaciones]
      .sort((a, b) => {
        const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
        const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }

  // Estadísticas por tipo de usuario
  calcularEstadisticasSubcanales() {
    console.log('UsuarioEstadisticasComponent - calcularEstadisticasSubcanales');
    if (!this.subcanales || this.subcanales.length === 0) return;

    // Calcular operaciones por subcanal
    this.operacionesPorSubcanal = {};
    this.subcanales.forEach(subcanal => {
      const ops = this.operaciones.filter(op => op.subcanalId === subcanal.id);
      this.operacionesPorSubcanal[subcanal.nombre] = ops.length;
    });

    // Determinar subcanal más activo
    let maxOps = 0;
    Object.entries(this.operacionesPorSubcanal).forEach(([nombre, cantidad]) => {
      if (cantidad > maxOps) {
        maxOps = cantidad;
        this.subcanalMasActivo = nombre;
      }
    });
  }

  calcularEstadisticasCanales() {
    console.log('UsuarioEstadisticasComponent - calcularEstadisticasCanales');
    if (!this.canales || this.canales.length === 0) return;

    // Calcular operaciones por canal
    this.operacionesPorCanal = {};
    this.canales.forEach(canal => {
      const ops = this.operaciones.filter(op => op.canalId === canal.id);
      this.operacionesPorCanal[canal.nombreFantasia] = ops.length;
    });

    // Determinar canal más activo
    let maxOps = 0;
    Object.entries(this.operacionesPorCanal).forEach(([nombre, cantidad]) => {
      if (cantidad > maxOps) {
        maxOps = cantidad;
        this.canalMasActivo = nombre;
      }
    });
  }

  calcularEstadisticasVendors() {
    console.log('UsuarioEstadisticasComponent - calcularEstadisticasVendors');
    if (!this.vendors || this.vendors.length === 0) return;

    // Calcular operaciones por vendor
    this.operacionesPorVendor = {};
    this.vendors.forEach(vendor => {
      const ops = this.operaciones.filter(op => op.vendedorId === vendor.id);
      const nombreCompleto = `${vendor.nombre} ${vendor.apellido}`;
      this.operacionesPorVendor[nombreCompleto] = ops.length;
    });

    // Determinar vendor más activo
    let maxOps = 0;
    Object.entries(this.operacionesPorVendor).forEach(([nombre, cantidad]) => {
      if (cantidad > maxOps) {
        maxOps = cantidad;
        this.vendorMasActivo = nombre;
      }
    });
  }

  // Inicialización de gráficos
  inicializarGraficoOperaciones() {
    console.log('UsuarioEstadisticasComponent - inicializarGraficoOperaciones');
    if (!this.operacionesPorMesChartRef) {
      console.warn('Chart reference not found: operacionesPorMesChartRef');
      return;
    }

    const canvas = this.operacionesPorMesChartRef.nativeElement as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas element not found for operacionesPorMesChart');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2D context for operacionesPorMesChart');
      return;
    }

    const { labels, data } = this.prepareChartData();
    console.log('Chart data prepared:', { labels, data });

    if (this.operacionesChart) {
      this.operacionesChart.destroy();
    }

    this.operacionesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Operaciones',
          data,
          backgroundColor: 'rgba(0, 158, 247, 0.5)',
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
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

    console.log('Operaciones chart initialized');
  }

  inicializarGraficoCanales() {
    console.log('UsuarioEstadisticasComponent - inicializarGraficoCanales');
    if (!this.canalesOperacionesChartRef) {
      console.warn('Chart reference not found: canalesOperacionesChartRef');
      return;
    }

    const canvas = this.canalesOperacionesChartRef.nativeElement as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas element not found for canalesOperacionesChart');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2D context for canalesOperacionesChart');
      return;
    }

    const labels = Object.keys(this.operacionesPorCanal);
    const data = Object.values(this.operacionesPorCanal);

    if (this.canalesChart) {
      this.canalesChart.destroy();
    }

    this.canalesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(0, 158, 247, 0.7)',
            'rgba(80, 205, 137, 0.7)',
            'rgba(255, 199, 0, 0.7)',
            'rgba(241, 65, 108, 0.7)',
            'rgba(114, 57, 234, 0.7)'
          ],
          borderColor: '#ffffff',
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

    console.log('Canales chart initialized');
  }

  inicializarGraficoSubcanales() {
    console.log('UsuarioEstadisticasComponent - inicializarGraficoSubcanales');
    if (!this.canalesOperacionesChartRef) {
      console.warn('Chart reference not found for subcanal chart: canalesOperacionesChartRef');
      return;
    }

    const canvas = this.canalesOperacionesChartRef.nativeElement as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas element not found for subcanales chart');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2D context for subcanales chart');
      return;
    }

    const labels = Object.keys(this.operacionesPorSubcanal);
    const data = Object.values(this.operacionesPorSubcanal);

    if (this.canalesChart) {
      this.canalesChart.destroy();
    }

    this.canalesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(0, 158, 247, 0.7)',
            'rgba(80, 205, 137, 0.7)',
            'rgba(255, 199, 0, 0.7)',
            'rgba(241, 65, 108, 0.7)',
            'rgba(114, 57, 234, 0.7)'
          ],
          borderColor: '#ffffff',
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

    console.log('Subcanales chart initialized');
  }

  inicializarGraficoVendors() {
    console.log('UsuarioEstadisticasComponent - inicializarGraficoVendors');
    if (!this.vendorsOperacionesChartRef) {
      console.warn('Chart reference not found: vendorsOperacionesChartRef');
      return;
    }

    const canvas = this.vendorsOperacionesChartRef.nativeElement as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas element not found for vendorsOperacionesChart');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2D context for vendorsOperacionesChart');
      return;
    }

    const labels = Object.keys(this.operacionesPorVendor);
    const data = Object.values(this.operacionesPorVendor);

    if (this.vendorsChart) {
      this.vendorsChart.destroy();
    }

    this.vendorsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Operaciones',
          data,
          backgroundColor: 'rgba(80, 205, 137, 0.7)',
          borderColor: 'rgba(80, 205, 137, 1)',
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
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

    console.log('Vendors chart initialized');
  }

  // Métodos auxiliares
  agruparOperacionesPorMes(operaciones: Operacion[]): { [key: string]: Operacion[] } {
    const result: { [key: string]: Operacion[] } = {};

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

  calcularTendenciaMensual(operacionesPorMes: { [key: string]: Operacion[] }): number {
    const meses = Object.keys(operacionesPorMes).sort();

    if (meses.length < 2) return 0;

    const mesActual = meses[meses.length - 1];
    const mesAnterior = meses[meses.length - 2];

    const cantidadActual = operacionesPorMes[mesActual].length;
    const cantidadAnterior = operacionesPorMes[mesAnterior].length;

    if (cantidadAnterior === 0) return 100;

    return Math.round((cantidadActual - cantidadAnterior) / cantidadAnterior * 100);
  }

  calcularTendenciaMonto(): number {
    if (this.operaciones.length < 2) return 0;

    const ordenadas = [...this.operaciones].sort((a, b) => {
      const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
      const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
      return dateA - dateB;
    });

    const mitad = Math.floor(ordenadas.length / 2);
    const primerasMitad = ordenadas.slice(0, mitad);
    const segundasMitad = ordenadas.slice(mitad);

    const promedioAntes = primerasMitad.reduce((sum, op) => sum + op.monto, 0) / primerasMitad.length;
    const promedioDespues = segundasMitad.reduce((sum, op) => sum + op.monto, 0) / segundasMitad.length;

    if (promedioAntes === 0) return 0;

    return Math.round((promedioDespues - promedioAntes) / promedioAntes * 100);
  }

  calcularTendenciaClientes(): number {
    // Valor simulado para esta implementación
    return Math.floor(Math.random() * 30) - 10; // Valor entre -10 y 20
  }

  prepareChartData(): { labels: string[], data: number[] } {
    console.log('UsuarioEstadisticasComponent - prepareChartData');
    const operacionesPorMes = this.agruparOperacionesPorMes(this.operaciones);
    const today = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      const monthName = date.toLocaleString('default', { month: 'short' });
      labels.push(`${monthName} ${year}`);
      data.push(operacionesPorMes[key]?.length || 0);
    }

    return { labels, data };
  }

  updateChartData() {
    console.log('UsuarioEstadisticasComponent - updateChartData');
    if (this.operacionesChart) {
      const { labels, data } = this.prepareChartData();
      this.operacionesChart.data.labels = labels;
      this.operacionesChart.data.datasets[0].data = data;
      this.operacionesChart.update('none');
    }

    if (this.usuario.rolId === RolType.AdminCanal && this.canalesChart) {
      const labels = Object.keys(this.operacionesPorSubcanal);
      const data = Object.values(this.operacionesPorSubcanal);
      this.canalesChart.data.labels = labels;
      this.canalesChart.data.datasets[0].data = data;
      this.canalesChart.update('none');
    } else if (this.usuario.rolId === RolType.OficialComercial && this.canalesChart) {
      const labels = Object.keys(this.operacionesPorCanal);
      const data = Object.values(this.operacionesPorCanal);
      this.canalesChart.data.labels = labels;
      this.canalesChart.data.datasets[0].data = data;
      this.canalesChart.update('none');
    }

    if ((this.usuario.rolId === RolType.AdminCanal || this.usuario.rolId === RolType.OficialComercial) && this.vendorsChart) {
      const labels = Object.keys(this.operacionesPorVendor);
      const data = Object.values(this.operacionesPorVendor);
      this.vendorsChart.data.labels = labels;
      this.vendorsChart.data.datasets[0].data = data;
      this.vendorsChart.update('none');
    }
  }

  // Métodos de ayuda para formateo
  getPerformanceTrendClass(value: number): string {
    if (value > 0) return 'trend-positive';
    if (value < 0) return 'trend-negative';
    return 'trend-neutral';
  }

  getTrendIconClass(value: number): string {
    if (value > 0) return 'bi-arrow-up';
    if (value < 0) return 'bi-arrow-down';
    return 'bi-dash';
  }

  getTrendPercentage(value: number): string {
    if (value === 0) return 'Sin cambios';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value}%`;
  }

  formatMontoSinDecimales(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  getEstadoClass(estado: string | undefined): string {
    if (!estado) return 'badge-light-warning';
    switch (estado.toLowerCase()) {
      case 'aprobado':
      case 'completado':
        return 'badge-light-success';
      case 'rechazado':
      case 'cancelado':
        return 'badge-light-danger';
      case 'pendiente':
        return 'badge-light-warning';
      case 'en proceso':
        return 'badge-light-info';
      default:
        return 'badge-light-info';
    }
  }
}
