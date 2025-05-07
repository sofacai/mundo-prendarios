// Archivo: src/app/pages/canales/components/canal-estadisticas/canal-estadisticas.component.ts
import { Component, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Operacion } from 'src/app/core/services/operacion.service';
import { Canal } from 'src/app/core/services/canal.service';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { Chart, registerables } from 'chart.js';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-canal-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-estadisticas.component.html',
  styleUrls: ['./canal-estadisticas.component.scss']
})
export class CanalEstadisticasComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() canal!: Canal;
  @Input() operaciones: Operacion[] = [];
  @Input() subcanales: Subcanal[] = [];
  @Input() vendedores: any[] = [];

  // Referencias a los gráficos
  private operacionesChart: Chart | null = null;
  private planesChart: Chart | null = null;
  private subcanalesChart: Chart | null = null;
  private vendedoresChart: Chart | null = null;

  constructor() {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {

    // Usar setTimeout para asegurar que el DOM está listo
    setTimeout(() => {
      this.initCharts();
    }, 500);
  }

  ngOnDestroy(): void {
    // Destruir gráficos al salir del componente
    this.destroyCharts();
  }

  // Inicializar gráficos
  initCharts(): void {

    // Verificar que los datos estén disponibles
    if (!this.canal) {
      console.error('El canal no está disponible');
      return;
    }

    try {
      this.initOperacionesChart();
      this.initPlanesChart();
      this.initSubcanalesChart();
      this.initVendedoresChart();
    } catch (error) {
    }
  }

  // Gráfico de operaciones por mes
  initOperacionesChart(): void {
    const canvas = document.getElementById('operacionesChart');
    if (!canvas) {
      console.error('Canvas operacionesChart no encontrado');
      return;
    }

    const ctx = canvas as HTMLCanvasElement;

    // Agrupar operaciones por mes
    const operacionesPorMes = this.groupOperacionesPorMes();

    // Destruir el gráfico anterior si existe
    if (this.operacionesChart) {
      this.operacionesChart.destroy();
    }

    this.operacionesChart = new Chart(ctx, {
      type: 'bar', // Cambiado de 'line' a 'bar'
      data: {
        labels: operacionesPorMes.meses,
        datasets: [
          {
            label: 'Operaciones Ingresadas',
            data: operacionesPorMes.totales,
            backgroundColor: 'rgba(0, 158, 247, 0.7)',
            borderColor: 'rgba(0, 158, 247, 1)',
            borderWidth: 1
          },
          {
            label: 'Operaciones Aprobadas',
            data: operacionesPorMes.aprobadas,
            backgroundColor: 'rgba(255, 199, 0, 0.7)',
            borderColor: 'rgba(255, 199, 0, 1)',
            borderWidth: 1
          },
          {
            label: 'Operaciones Liquidadas',
            data: operacionesPorMes.liquidadas,
            backgroundColor: 'rgba(80, 205, 137, 0.7)',
            borderColor: 'rgba(80, 205, 137, 1)',
            borderWidth: 1
          }
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
  initPlanesChart(): void {
    const canvas = document.getElementById('planesChart');
    if (!canvas) {
      console.error('Canvas planesChart no encontrado');
      return;
    }

    const ctx = canvas as HTMLCanvasElement;

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
        datasets: [
          {
            label: 'Operaciones Ingresadas',
            data: distribucionPlanes.map(item => item.operaciones),
            backgroundColor: [
              'rgba(0, 158, 247, 0.7)',
              'rgba(255, 168, 0, 0.7)',
              'rgba(241, 65, 108, 0.7)',
              'rgba(114, 57, 234, 0.7)',
              'rgba(25, 135, 84, 0.7)',
              'rgba(102, 16, 242, 0.7)'
            ],
            borderWidth: 1
          },
          {
            label: 'Operaciones Liquidadas',
            data: distribucionPlanes.map(item => item.operacionesLiquidadas),
            backgroundColor: [
              'rgba(0, 158, 247, 0.9)',
              'rgba(255, 168, 0, 0.9)',
              'rgba(241, 65, 108, 0.9)',
              'rgba(114, 57, 234, 0.9)',
              'rgba(25, 135, 84, 0.9)',
              'rgba(102, 16, 242, 0.9)'
            ],
            borderWidth: 1
          }
        ]
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
  initSubcanalesChart(): void {
    const canvas = document.getElementById('subcanalesChart');
    if (!canvas) {
      console.error('Canvas subcanalesChart no encontrado');
      return;
    }

    const ctx = canvas as HTMLCanvasElement;

    // Obtener operaciones por subcanal
    const operacionesPorSubcanal = this.getOperacionesPorSubcanal();

    if (this.subcanalesChart) {
      this.subcanalesChart.destroy();
    }

    this.subcanalesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: operacionesPorSubcanal.map(item => item.nombre),
        datasets: [
          {
            label: 'Operaciones Ingresadas',
            data: operacionesPorSubcanal.map(item => item.operaciones),
            backgroundColor: 'rgba(0, 158, 247, 0.7)',
            borderColor: 'rgba(0, 158, 247, 1)',
            borderWidth: 1
          },
          {
            label: 'Operaciones Aprobadas',
            data: operacionesPorSubcanal.map(item => item.operacionesAprobadas),
            backgroundColor: 'rgba(255, 199, 0, 0.7)',
            borderColor: 'rgba(255, 199, 0, 1)',
            borderWidth: 1
          },
          {
            label: 'Operaciones Liquidadas',
            data: operacionesPorSubcanal.map(item => item.operacionesLiquidadas),
            backgroundColor: 'rgba(80, 205, 137, 0.7)',
            borderColor: 'rgba(80, 205, 137, 1)',
            borderWidth: 1
          }
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
          }
        }
      }
    });
  }

  // Gráfico de rendimiento de vendedores
  initVendedoresChart(): void {
    const canvas = document.getElementById('vendedoresChart');
    if (!canvas) {
      console.error('Canvas vendedoresChart no encontrado');
      return;
    }

    const ctx = canvas as HTMLCanvasElement;

    // Obtener rendimiento de vendedores
    const rendimientoVendedores = this.getRendimientoVendedores();

    // Destruir el gráfico anterior si existe
    if (this.vendedoresChart) {
      this.vendedoresChart.destroy();
    }

    this.vendedoresChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: rendimientoVendedores.map(item => item.nombre),
        datasets: [
          {
            label: 'Operaciones Ingresadas',
            data: rendimientoVendedores.map(item => item.operaciones),
            backgroundColor: 'rgba(0, 158, 247, 0.7)',
            borderColor: 'rgba(0, 158, 247, 1)',
            borderWidth: 1
          },
          {
            label: 'Operaciones Aprobadas',
            data: rendimientoVendedores.map(item => item.operacionesAprobadas),
            backgroundColor: 'rgba(255, 199, 0, 0.7)',
            borderColor: 'rgba(255, 199, 0, 1)',
            borderWidth: 1
          },
          {
            label: 'Operaciones Liquidadas',
            data: rendimientoVendedores.map(item => item.operacionesLiquidadas),
            backgroundColor: 'rgba(80, 205, 137, 0.7)',
            borderColor: 'rgba(80, 205, 137, 1)',
            borderWidth: 1
          }
        ]
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
  destroyCharts(): void {
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
  groupOperacionesPorMes(): {meses: string[], totales: number[], liquidadas: number[], aprobadas: number[]} {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const operacionesPorMes = new Map();
    const operacionesLiquidadasPorMes = new Map();
    const operacionesAprobadasPorMes = new Map();

    // Inicializar todos los meses con 0
    meses.forEach(mes => {
      operacionesPorMes.set(mes, 0);
      operacionesLiquidadasPorMes.set(mes, 0);
      operacionesAprobadasPorMes.set(mes, 0);
    });

    // Si no hay operaciones, devolver datos de muestra
    if (!this.operaciones || this.operaciones.length === 0) {
      return {
        meses: meses.slice(0, 6),
        totales: Array(6).fill(0),
        liquidadas: Array(6).fill(0),
        aprobadas: Array(6).fill(0)
      };
    }

    // Agrupar operaciones por mes
    this.operaciones.forEach(op => {
      if (op.fechaCreacion) {
        const fecha = new Date(op.fechaCreacion);
        const mes = meses[fecha.getMonth()];

        // Incrementar total de operaciones
        operacionesPorMes.set(mes, (operacionesPorMes.get(mes) || 0) + 1);

        // Incrementar operaciones liquidadas si aplica
        if (op.estado === 'LIQUIDADA') {
          operacionesLiquidadasPorMes.set(mes, (operacionesLiquidadasPorMes.get(mes) || 0) + 1);
        }

        // Incrementar operaciones aprobadas si aplica
        if (['EN PROC.LIQ.', 'EN PROC.INSC.', 'FIRMAR DOCUM', 'EN GESTION', 'APROBADO DEF'].includes(op.estado || '')) {
          operacionesAprobadasPorMes.set(mes, (operacionesAprobadasPorMes.get(mes) || 0) + 1);
        }
      }
    });

    // Obtener los últimos 6 meses
    const mesesRecientes = meses.slice(0, 6);
    const totales = mesesRecientes.map(mes => operacionesPorMes.get(mes) || 0);
    const liquidadas = mesesRecientes.map(mes => operacionesLiquidadasPorMes.get(mes) || 0);
    const aprobadas = mesesRecientes.map(mes => operacionesAprobadasPorMes.get(mes) || 0);

    return { meses: mesesRecientes, totales, liquidadas, aprobadas };
  }

  getDistribucionPlanes(): {nombre: string, operaciones: number, operacionesLiquidadas: number}[] {

    // Si no hay planes, devolver datos de muestra
    if (!this.canal || !this.canal.planesCanal || this.canal.planesCanal.length === 0) {
      return [
        { nombre: 'Plan A', operaciones: 0, operacionesLiquidadas: 0 },
        { nombre: 'Plan B', operaciones: 0, operacionesLiquidadas: 0 }
      ];
    }

    // Generar datos basados en los planes reales
    const distribucion = this.canal.planesCanal
      .filter(planCanal => planCanal.activo)
      .map(planCanal => {
        const operacionesDelPlan = this.operaciones.filter(op => op.planId === planCanal.planId);
        const operacionesCount = operacionesDelPlan.length;
        const operacionesLiquidadasCount = operacionesDelPlan.filter(op => op.estado && op.estado.toLowerCase() === 'liquidada').length;

        return {
          nombre: planCanal.plan?.nombre || `Plan ${planCanal.planId}`,
          operaciones: operacionesCount,
          operacionesLiquidadas: operacionesLiquidadasCount
        };
      });

    return distribucion;
  }

  getOperacionesPorSubcanal(): {nombre: string, operaciones: number, operacionesLiquidadas: number, operacionesAprobadas: number}[] {
    // Si no hay subcanales, devolver datos de muestra
    if (!this.subcanales || this.subcanales.length === 0) {
      return [
        { nombre: 'Subcanal A', operaciones: 0, operacionesLiquidadas: 0, operacionesAprobadas: 0 },
        { nombre: 'Subcanal B', operaciones: 0, operacionesLiquidadas: 0, operacionesAprobadas: 0 }
      ];
    }

    // Generar datos basados en los subcanales reales
    const operacionesPorSubcanal = this.subcanales
      .filter(subcanal => subcanal.activo)
      .map(subcanal => {
        const operacionesDelSubcanal = this.operaciones.filter(op => op.subcanalId === subcanal.id);
        const operacionesCount = operacionesDelSubcanal.length;
        const operacionesLiquidadasCount = operacionesDelSubcanal.filter(op => op.estado === 'LIQUIDADA').length;
        const operacionesAprobadasCount = operacionesDelSubcanal.filter(op =>
          ['EN PROC.LIQ.', 'EN PROC.INSC.', 'FIRMAR DOCUM', 'EN GESTION', 'APROBADO DEF'].includes(op.estado || '')
        ).length;

        return {
          nombre: subcanal.nombre,
          operaciones: operacionesCount,
          operacionesLiquidadas: operacionesLiquidadasCount,
          operacionesAprobadas: operacionesAprobadasCount
        };
      });

    return operacionesPorSubcanal;
  }


  getRendimientoVendedores(): {nombre: string, operaciones: number, operacionesLiquidadas: number, operacionesAprobadas: number}[] {
    // Si no hay vendedores, devolver datos de muestra
    if (!this.vendedores || this.vendedores.length === 0) {
      return [
        { nombre: 'Vendedor A', operaciones: 0, operacionesLiquidadas: 0, operacionesAprobadas: 0 },
        { nombre: 'Vendedor B', operaciones: 0, operacionesLiquidadas: 0, operacionesAprobadas: 0 }
      ];
    }

    // Generar datos basados en los vendedores reales
    const rendimientoVendedores = this.vendedores
      .map(vendor => {
        const operacionesDelVendedor = this.operaciones.filter(op => op.vendedorId === vendor.id);
        const operacionesCount = operacionesDelVendedor.length;
        const operacionesLiquidadasCount = operacionesDelVendedor.filter(op => op.estado === 'LIQUIDADA').length;
        const operacionesAprobadasCount = operacionesDelVendedor.filter(op =>
          ['EN PROC.LIQ.', 'EN PROC.INSC.', 'FIRMAR DOCUM', 'EN GESTION', 'APROBADO DEF'].includes(op.estado || '')
        ).length;

        return {
          nombre: `${vendor.nombre || ''} ${vendor.apellido || ''}`.trim(),
          operaciones: operacionesCount,
          operacionesLiquidadas: operacionesLiquidadasCount,
          operacionesAprobadas: operacionesAprobadasCount
        };
      })
      .sort((a, b) => b.operaciones - a.operaciones) // Ordenar por cantidad de operaciones
      .slice(0, 5); // Mostrar solo los 5 mejores

    return rendimientoVendedores;
  }
}
