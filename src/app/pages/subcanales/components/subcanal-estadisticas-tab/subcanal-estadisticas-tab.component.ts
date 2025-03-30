import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { Operacion } from 'src/app/core/services/operacion.service';
import { Cliente } from 'src/app/core/services/cliente.service';
import { Subcanal } from 'src/app/core/services/subcanal.service';

@Component({
  selector: 'app-subcanal-estadisticas-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcanal-estadisticas-tab.component.html',
  styleUrls: ['./subcanal-estadisticas-tab.component.scss']
})
export class SubcanalEstadisticasTabComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() operaciones: Operacion[] = [];
  @Input() clientes: Cliente[] = [];
  @Input() subcanal!: Subcanal;
  @Input() activeTab: string = '';

  // Referencias a los gráficos
  private operacionesChart: Chart | null = null;
  private vendedoresChart: Chart | null = null;
  private montosChart: Chart | null = null;
  private clientesChart: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.activeTab === 'estadisticas') {
      this.initCharts();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia el tab activo y ahora es 'estadisticas', inicializar gráficos
    if (changes['activeTab'] && this.activeTab === 'estadisticas') {
      setTimeout(() => {
        this.destroyCharts();
        this.initCharts();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  // Inicializar gráficos
  initCharts(): void {
    this.initOperacionesChart();
    this.initVendedoresChart();
    this.initMontosChart();
    this.initClientesChart();
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
          }
        }
      }
    });
  }

  // Gráfico de distribución por vendedores
  initVendedoresChart(): void {
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
  initMontosChart(): void {
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
  initClientesChart(): void {
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
  destroyCharts(): void {
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
  groupOperacionesPorMes(): any[] {
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

  getDistribucionVendedores(): any[] {
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

  groupMontosPorMes(): any[] {
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

  groupClientesPorMes(): any[] {
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
}
