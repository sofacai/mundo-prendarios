// Archivo: src/app/pages/canales/components/canal-estadisticas/canal-estadisticas.component.ts
import { Component, Input, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
    console.log('CanalEstadisticasComponent constructor');
  }

  ngOnInit(): void {
    console.log('CanalEstadisticasComponent ngOnInit');
    console.log('Canal:', this.canal);
    console.log('Operaciones:', this.operaciones?.length || 0);
    console.log('Subcanales:', this.subcanales?.length || 0);
    console.log('Vendedores:', this.vendedores?.length || 0);
  }

  ngAfterViewInit(): void {
    console.log('CanalEstadisticasComponent ngAfterViewInit');

    // Usar setTimeout para asegurar que el DOM está listo
    setTimeout(() => {
      console.log('Inicializando gráficos...');
      this.initCharts();
    }, 500);
  }

  ngOnDestroy(): void {
    console.log('CanalEstadisticasComponent ngOnDestroy');
    // Destruir gráficos al salir del componente
    this.destroyCharts();
  }

  // Inicializar gráficos
  initCharts(): void {
    console.log('Llamando a initCharts');

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
      console.log('Gráficos inicializados correctamente');
    } catch (error) {
      console.error('Error al inicializar gráficos:', error);
    }
  }

  // Gráfico de operaciones por mes
  initOperacionesChart(): void {
    console.log('Inicializando gráfico de operaciones...');
    const canvas = document.getElementById('operacionesChart');
    if (!canvas) {
      console.error('Canvas operacionesChart no encontrado');
      return;
    }

    const ctx = canvas as HTMLCanvasElement;
    console.log('Canvas encontrado:', ctx);

    // Agrupar operaciones por mes
    const operacionesPorMes = this.groupOperacionesPorMes();
    console.log('Datos para gráfico de operaciones:', operacionesPorMes);

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

    console.log('Gráfico de operaciones creado:', this.operacionesChart);
  }

  // Gráfico de distribución por planes
  initPlanesChart(): void {
    console.log('Inicializando gráfico de planes...');
    const canvas = document.getElementById('planesChart');
    if (!canvas) {
      console.error('Canvas planesChart no encontrado');
      return;
    }

    const ctx = canvas as HTMLCanvasElement;

    // Obtener distribución de planes
    const distribucionPlanes = this.getDistribucionPlanes();
    console.log('Datos para gráfico de planes:', distribucionPlanes);

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

    console.log('Gráfico de planes creado:', this.planesChart);
  }

  // Gráfico de operaciones por subcanal
  initSubcanalesChart(): void {
    console.log('Inicializando gráfico de subcanales...');
    const canvas = document.getElementById('subcanalesChart');
    if (!canvas) {
      console.error('Canvas subcanalesChart no encontrado');
      return;
    }

    const ctx = canvas as HTMLCanvasElement;

    // Obtener operaciones por subcanal
    const operacionesPorSubcanal = this.getOperacionesPorSubcanal();
    console.log('Datos para gráfico de subcanales:', operacionesPorSubcanal);

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

    console.log('Gráfico de subcanales creado:', this.subcanalesChart);
  }

  // Gráfico de rendimiento de vendedores
  initVendedoresChart(): void {
    console.log('Inicializando gráfico de vendedores...');
    const canvas = document.getElementById('vendedoresChart');
    if (!canvas) {
      console.error('Canvas vendedoresChart no encontrado');
      return;
    }

    const ctx = canvas as HTMLCanvasElement;

    // Obtener rendimiento de vendedores
    const rendimientoVendedores = this.getRendimientoVendedores();
    console.log('Datos para gráfico de vendedores:', rendimientoVendedores);

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

    console.log('Gráfico de vendedores creado:', this.vendedoresChart);
  }

  // Destruir todos los gráficos
  destroyCharts(): void {
    console.log('Destruyendo gráficos...');
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
    console.log('Procesando operaciones para agrupar por mes:', this.operaciones);

    // Si no hay operaciones, devolver datos de muestra
    if (!this.operaciones || this.operaciones.length === 0) {
      console.log('No hay operaciones, devolviendo datos de muestra');
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
    const resultado = Array.from(operacionesPorMes.entries())
      .map(([mes, cantidad]) => ({ mes, cantidad }))
      .slice(0, 6); // Mostrar los primeros 6 meses para simplicidad

    console.log('Operaciones por mes procesadas:', resultado);
    return resultado;
  }

  getDistribucionPlanes(): {nombre: string, operaciones: number}[] {
    console.log('Procesando distribución de planes...');

    // Si no hay planes, devolver datos de muestra
    if (!this.canal || !this.canal.planesCanal || this.canal.planesCanal.length === 0) {
      console.log('No hay planes, devolviendo datos de muestra');
      return [
        { nombre: 'Plan A', operaciones: 0 },
        { nombre: 'Plan B', operaciones: 0 }
      ];
    }

    // Generar datos basados en los planes reales
    const distribucion = this.canal.planesCanal
      .filter(planCanal => planCanal.activo)
      .map(planCanal => {
        const operacionesCount = this.operaciones.filter(op => op.planId === planCanal.planId).length;
        return {
          nombre: planCanal.plan?.nombre || `Plan ${planCanal.planId}`,
          operaciones: operacionesCount
        };
      });

    console.log('Distribución de planes procesada:', distribucion);
    return distribucion;
  }

  getOperacionesPorSubcanal(): {nombre: string, operaciones: number}[] {
    console.log('Procesando operaciones por subcanal...');

    // Si no hay subcanales, devolver datos de muestra
    if (!this.subcanales || this.subcanales.length === 0) {
      console.log('No hay subcanales, devolviendo datos de muestra');
      return [
        { nombre: 'Subcanal A', operaciones: 0 },
        { nombre: 'Subcanal B', operaciones: 0 }
      ];
    }

    // Generar datos basados en los subcanales reales
    const operacionesPorSubcanal = this.subcanales
      .filter(subcanal => subcanal.activo)
      .map(subcanal => {
        const operacionesCount = this.operaciones.filter(op => op.subcanalId === subcanal.id).length;
        return {
          nombre: subcanal.nombre,
          operaciones: operacionesCount
        };
      });

    console.log('Operaciones por subcanal procesadas:', operacionesPorSubcanal);
    return operacionesPorSubcanal;
  }

  getRendimientoVendedores(): {nombre: string, operaciones: number}[] {
    console.log('Procesando rendimiento de vendedores...');

    // Si no hay vendedores, devolver datos de muestra
    if (!this.vendedores || this.vendedores.length === 0) {
      console.log('No hay vendedores, devolviendo datos de muestra');
      return [
        { nombre: 'Vendedor A', operaciones: 0 },
        { nombre: 'Vendedor B', operaciones: 0 }
      ];
    }

    // Generar datos basados en los vendedores reales
    const rendimientoVendedores = this.vendedores
      .map(vendor => {
        const operacionesCount = this.operaciones.filter(op => op.vendedorId === vendor.id).length;
        return {
          nombre: `${vendor.nombre || ''} ${vendor.apellido || ''}`.trim(),
          operaciones: operacionesCount
        };
      })
      .sort((a, b) => b.operaciones - a.operaciones) // Ordenar por cantidad de operaciones
      .slice(0, 5); // Mostrar solo los 5 mejores

    console.log('Rendimiento de vendedores procesado:', rendimientoVendedores);
    return rendimientoVendedores;
  }
}
