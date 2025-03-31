// src/app/pages/usuarios/components/usuario-estadisticas/usuario-estadisticas.component.ts
import { Component, OnInit, OnChanges, Input, ElementRef, ViewChild, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { UsuarioDto, VendorEstadisticasDto } from 'src/app/core/services/usuario.service';
import { Operacion } from 'src/app/core/services/operacion.service';
import { Cliente } from 'src/app/core/services/cliente.service';

// Registrar todos los componentes de Chart.js
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

  @ViewChild('operacionesPorMesChart') operacionesPorMesChartRef!: ElementRef;

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

  // Instancia del gráfico
  private operacionesChart: Chart | null = null;

  constructor() { }

  ngOnInit() {
    this.calculatedStats();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['operaciones'] || changes['clientes']) {
      this.calculatedStats();
      // Solo actualizamos el gráfico si ya ha sido inicializado
      if (this.chartInitialized && this.operacionesChart) {
        this.updateChartData();
      }
    }
  }

  ngAfterViewInit() {
    // Esperamos a que la vista se estabilice antes de inicializar el gráfico
    setTimeout(() => {
      this.initializeChart();
    }, 100);
  }

  // Inicializar el gráfico
  initializeChart() {
    if (!this.operacionesPorMesChartRef) return;

    const canvas = this.operacionesPorMesChartRef.nativeElement as HTMLCanvasElement;
    if (!canvas) return;

    this.createChart();
  }

  // Calcular estadísticas basadas en los datos
  calculatedStats() {
    // Filtrar operaciones activas (no canceladas ni rechazadas)
    this.operacionesActivas = this.operaciones.filter(op =>
      !op.estado ||
      (op.estado.toLowerCase() !== 'cancelado' &&
       op.estado.toLowerCase() !== 'rechazado')
    ).length;

    // Calcular monto total
    this.montoTotal = this.operaciones.reduce((sum, op) => sum + op.monto, 0);

    // Calcular monto promedio
    this.montoPromedio = this.operaciones.length > 0
      ? this.montoTotal / this.operaciones.length
      : 0;

    // Calcular promedio mensual de operaciones
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Filtrar operaciones del último año
    const operacionesUltimoAnio = this.operaciones.filter(op => {
      const fechaOp = op.fechaCreacion ? new Date(op.fechaCreacion) : null;
      return fechaOp && fechaOp >= oneYearAgo;
    });

    // Agrupar por mes
    const operacionesPorMes = this.agruparOperacionesPorMes(operacionesUltimoAnio);

    // Calcular promedio
    const meses = Object.keys(operacionesPorMes).length || 1;
    this.promedioMensual = Math.round(operacionesUltimoAnio.length / meses * 10) / 10;

    // Calcular tendencia mensual (comparando con mes anterior)
    this.trendMensual = this.calcularTendenciaMensual(operacionesPorMes);

    // Calcular tendencia de monto promedio
    this.trendMonto = this.calcularTendenciaMonto();

    // Calcular clientes nuevos en el último mes
    this.clientesNuevosMes = this.calcularClientesNuevosMes();

    // Calcular tendencia de clientes nuevos
    this.trendClientes = this.calcularTendenciaClientes();

    // Últimas 5 operaciones
    this.ultimasOperaciones = [...this.operaciones]
      .sort((a, b) => {
        const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
        const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    // Determinar si hay suficientes datos para el gráfico
    this.hasSufficientData = Object.keys(operacionesPorMes).length >= 2;
  }

  // Agrupar operaciones por mes
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

  // Calcular tendencia mensual
  calcularTendenciaMensual(operacionesPorMes: { [key: string]: Operacion[] }): number {
    const meses = Object.keys(operacionesPorMes).sort();

    if (meses.length < 2) return 0;

    const mesActual = meses[meses.length - 1];
    const mesAnterior = meses[meses.length - 2];

    const cantidadActual = operacionesPorMes[mesActual].length;
    const cantidadAnterior = operacionesPorMes[mesAnterior].length;

    if (cantidadAnterior === 0) return 100; // Si no había operaciones antes, es un aumento del 100%

    return Math.round((cantidadActual - cantidadAnterior) / cantidadAnterior * 100);
  }

  // Calcular tendencia de monto promedio
  calcularTendenciaMonto(): number {
    // Simplificado para demostración - se podría mejorar con cálculos reales por mes
    if (this.operaciones.length < 2) return 0;

    // Ordenar operaciones por fecha
    const ordenadas = [...this.operaciones].sort((a, b) => {
      const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
      const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
      return dateA - dateB;
    });

    // Dividir en dos mitades
    const mitad = Math.floor(ordenadas.length / 2);
    const primerasMitad = ordenadas.slice(0, mitad);
    const segundasMitad = ordenadas.slice(mitad);

    // Calcular promedios
    const promedioAntes = primerasMitad.reduce((sum, op) => sum + op.monto, 0) / primerasMitad.length;
    const promedioDespues = segundasMitad.reduce((sum, op) => sum + op.monto, 0) / segundasMitad.length;

    if (promedioAntes === 0) return 0;

    return Math.round((promedioDespues - promedioAntes) / promedioAntes * 100);
  }

  // Calcular clientes nuevos en el último mes
  calcularClientesNuevosMes(): number {
    const hoy = new Date();
    const unMesAtras = new Date();
    unMesAtras.setMonth(hoy.getMonth() - 1);

    // Filtrar clientes creados en el último mes
    // Nota: Esto asume que la fecha de creación del cliente está en fechaCreacion
    return this.clientes.filter(cliente => {
      if (!cliente.fechaCreacion) return false;
      const fechaCliente = new Date(cliente.fechaCreacion);
      return fechaCliente >= unMesAtras && fechaCliente <= hoy;
    }).length;
  }

  // Calcular tendencia de clientes nuevos
  calcularTendenciaClientes(): number {
    // Simplificado para demostración
    // Asumir un valor de ejemplo para la demostración
    return 15; // 15% de crecimiento
  }

  // Crear gráfico de operaciones por mes
  createChart() {
    if (!this.operacionesPorMesChartRef) return;

    const canvas = this.operacionesPorMesChartRef.nativeElement as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Preparar datos
    const { labels, data } = this.prepareChartData();

    // Destruir gráfico existente si hay uno
    if (this.operacionesChart) {
      this.operacionesChart.destroy();
    }

    // Crear nuevo gráfico
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
        animation: {
          duration: 500 // Reducir duración de la animación
        },
        plugins: {
          legend: {
            display: false // Ocultar leyenda para simplificar
          }
        }
      }
    });

    // Marcar el gráfico como inicializado
    this.chartInitialized = true;
  }

  // Preparar datos para el gráfico
  prepareChartData(): { labels: string[], data: number[] } {
    // Agrupar operaciones por mes
    const operacionesPorMes = this.agruparOperacionesPorMes(this.operaciones);

    // Obtener los últimos 12 meses (o menos si no hay suficientes datos)
    const today = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    // Generar array de los últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      // Formato para mostrar en el gráfico
      const monthName = date.toLocaleString('default', { month: 'short' });
      labels.push(`${monthName} ${year}`);

      // Contar operaciones para este mes
      data.push(operacionesPorMes[key]?.length || 0);
    }

    return { labels, data };
  }

  // Actualizar datos del gráfico
  updateChartData() {
    if (!this.operacionesChart) return;

    const { labels, data } = this.prepareChartData();

    this.operacionesChart.data.labels = labels;
    this.operacionesChart.data.datasets[0].data = data;
    this.operacionesChart.update('none'); // Actualizar sin animación para evitar parpadeos
  }

  // Métodos de ayuda para las tendencias
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

  // Formatear moneda
  formatMonto(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  // Formatear fecha
  formatDate(date: Date | undefined | null): string {
    if (!date) return '';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Obtener clase para el estado
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
