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

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // Inicializar gráficos después de que la vista esté lista
    setTimeout(() => {
      this.initCharts();
    }, 200);
  }

  ngOnDestroy(): void {
    // Destruir gráficos al salir del componente
    this.destroyCharts();
  }

  // Inicializar gráficos
  initCharts(): void {
    this.initOperacionesChart();
    this.initPlanesChart();
    this.initSubcanalesChart();
    this.initVendedoresChart();
  }

  // Gráfico de operaciones por mes
  initOperacionesChart(): void {
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
  initPlanesChart(): void {
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
  initSubcanalesChart(): void {
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
  initVendedoresChart(): void {
    const ctx = document.getElementById('vendedoresChart') as HTMLCanvasElement;
    if (!ctx) return;

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
  groupOperacionesPorMes(): {mes: string, cantidad: number}[] {
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

  getDistribucionPlanes(): {nombre: string, operaciones: number}[] {
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

  getOperacionesPorSubcanal(): {nombre: string, operaciones: number}[] {
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

  getRendimientoVendedores(): {nombre: string, operaciones: number}[] {
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
}
