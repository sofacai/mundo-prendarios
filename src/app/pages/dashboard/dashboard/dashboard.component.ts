import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from 'src/app/core/services/auth.service';
import { OperacionService } from 'src/app/core/services/operacion.service';
import { CanalService } from 'src/app/core/services/canal.service';
import { SubcanalService } from 'src/app/core/services/subcanal.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { PlanService } from 'src/app/core/services/plan.service';
import { RolType } from 'src/app/core/models/usuario.model';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardWelcomeComponent implements OnInit {
  private sidebarSubscription: Subscription | null = null;

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
  operacionesPendientes: number = 0;
  totalMontosLiquidados: number = 0;

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

  // Charts
  operacionesChart: Chart | null = null;
  distribucionChart: Chart | null = null;
  comparacionChart: Chart | null = null;

  // Not showing any data condition
  hasData: boolean = false;

  isSidebarCollapsed = false;


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

    // Cargar datos según el rol del usuario
    this.loadDataBasedOnRole();
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

  calculateGeneralStats(): void {
    // Total de operaciones
    this.totalOperaciones = this.operaciones.length;

    // Operaciones liquidadas
    this.operacionesLiquidadas = this.operaciones.filter(op => op.estado === 'LIQUIDADA').length;

    // Operaciones pendientes
    this.operacionesPendientes = this.operaciones.filter(op => op.estado !== 'LIQUIDADA' && op.estado !== 'Rechazada' && op.estado !== 'Cancelada').length;

    // Total montos liquidados
    this.totalMontosLiquidados = this.operaciones
      .filter(op => op.estado === 'LIQUIDADA')
      .reduce((total, op) => total + op.monto, 0);
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
    // Estadísticas por canal
    this.canalStats = this.canales.map(canal => {
      const operacionesCanal = this.operaciones.filter(op => op.canalId === canal.id);
      const operacionesLiquidadas = operacionesCanal.filter(op => op.estado === 'LIQUIDADA');

      return {
        nombre: canal.nombreFantasia,
        totalOperaciones: operacionesCanal.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesCanal.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
      };
    }).sort((a, b) => b.totalOperaciones - a.totalOperaciones);

    // Estadísticas por plan
    this.planesStats = this.planes.map(plan => {
      const operacionesPlan = this.operaciones.filter(op => op.planId === plan.id);
      const operacionesLiquidadas = operacionesPlan.filter(op => op.estado === 'LIQUIDADA');

      return {
        nombre: plan.nombre,
        totalOperaciones: operacionesPlan.length,
        operacionesLiquidadas: operacionesLiquidadas.length,
        montoTotal: operacionesPlan.reduce((total, op) => total + op.monto, 0),
        montoLiquidado: operacionesLiquidadas.reduce((total, op) => total + op.monto, 0)
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

      const operacionesLiquidadas = operacionesAdmin.filter(op => op.estado === 'LIQUIDADA');

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
      const operacionesLiquidadas = operacionesVendor.filter(op => op.estado === 'LIQUIDADA');

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

      const operacionesLiquidadas = operacionesOficial.filter(op => op.estado === 'LIQUIDADA');

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
      const operacionesLiquidadas = operacionesCanal.filter(op => op.estado === 'LIQUIDADA');

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

        const operacionesLiquidadas = operacionesAdmin.filter(op => op.estado === 'LIQUIDADA');

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
        const operacionesLiquidadas = operacionesVendor.filter(op => op.estado === 'LIQUIDADA');

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
      const operacionesLiquidadas = operacionesSubcanal.filter(op => op.estado === 'LIQUIDADA');

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
      const operacionesLiquidadas = operacionesVendor.filter(op => op.estado === 'LIQUIDADA');

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
    // Agrupar operaciones por mes
    const operacionesPorMes = this.agruparOperacionesPorMes(this.operaciones);
  }

  initializeCharts(): void {
    // Solo inicializar gráficos si hay datos
    if (this.hasData) {
      setTimeout(() => {
        this.initOperacionesChart();
        this.initDistribucionChart();

        // Para admin y oficial comercial, inicializar gráfico de comparación
        if (this.userRole === RolType.Administrador || this.userRole === RolType.OficialComercial) {
          this.initComparacionChart();
        }
      }, 300);
    }
  }

  initOperacionesChart(): void {
    const canvas = document.getElementById('operacionesChart');
    if (!canvas) return;

    const ctx = canvas as HTMLCanvasElement;

    // Agrupar operaciones por mes
    const operacionesPorMes = this.groupOperacionesPorMes();

    if (this.operacionesChart) {
      this.operacionesChart.destroy();
    }

    this.operacionesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: operacionesPorMes.meses,
        datasets: [
          {
            label: 'Total Operaciones',
            data: operacionesPorMes.totales,
            backgroundColor: 'rgba(0, 158, 247, 0.2)',
            borderColor: 'rgba(0, 158, 247, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          },
          {
            label: 'Operaciones Liquidadas',
            data: operacionesPorMes.liquidadas,
            backgroundColor: 'rgba(80, 205, 137, 0.2)',
            borderColor: 'rgba(80, 205, 137, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
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

  initDistribucionChart(): void {
    const canvas = document.getElementById('distribucionChart');
    if (!canvas) return;

    const ctx = canvas as HTMLCanvasElement;

    let labels: string[] = [];
    let data: number[] = [];

    // Datos según rol
    if (this.userRole === RolType.Administrador) {
      labels = this.canalStats.slice(0, 5).map(item => item.nombre);
      data = this.canalStats.slice(0, 5).map(item => item.totalOperaciones);
    } else if (this.userRole === RolType.OficialComercial) {
      labels = this.canalStats.slice(0, 5).map(item => item.nombre);
      data = this.canalStats.slice(0, 5).map(item => item.totalOperaciones);
    } else if (this.userRole === RolType.AdminCanal) {
      labels = this.subcanalStats.slice(0, 5).map(item => item.nombre);
      data = this.subcanalStats.slice(0, 5).map(item => item.totalOperaciones);
    } else {
      // Para Vendor, mostrar por estado
      const operacionesPorEstado: {[key: string]: number} = {};
      this.operaciones.forEach(op => {
        const estado = op.estado || 'Sin estado';
        operacionesPorEstado[estado] = (operacionesPorEstado[estado] || 0) + 1;
      });

      labels = Object.keys(operacionesPorEstado);
      data = Object.values(operacionesPorEstado);
    }

    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }

    this.distribucionChart = new Chart(ctx, {
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

  initComparacionChart(): void {
    const canvas = document.getElementById('comparacionChart');
    if (!canvas) return;

    const ctx = canvas as HTMLCanvasElement;

    // Para comparar rendimiento por tipo de usuario (solo para admin y oficial comercial)
    let labels: string[] = [];
    let dataTotales: number[] = [];
    let dataLiquidadas: number[] = [];

    if (this.userRole === RolType.Administrador) {
      // Crear datos comparativos por tipo de rol
      const adminCanal = this.adminCanalStats.reduce((sum, item) => sum + item.totalOperaciones, 0);
      const oficialComercial = this.oficialComercialStats.reduce((sum, item) => sum + item.totalOperaciones, 0);
      const vendor = this.vendorStats.reduce((sum, item) => sum + item.totalOperaciones, 0);

      const adminCanalLiquidadas = this.adminCanalStats.reduce((sum, item) => sum + item.operacionesLiquidadas, 0);
      const oficialComercialLiquidadas = this.oficialComercialStats.reduce((sum, item) => sum + item.operacionesLiquidadas, 0);
      const vendorLiquidadas = this.vendorStats.reduce((sum, item) => sum + item.operacionesLiquidadas, 0);

      labels = ['Admin Canal', 'Oficial Comercial', 'Vendor'];
      dataTotales = [adminCanal, oficialComercial, vendor];
      dataLiquidadas = [adminCanalLiquidadas, oficialComercialLiquidadas, vendorLiquidadas];
    } else if (this.userRole === RolType.OficialComercial) {
      // Mostrar top 5 vendors vs admin canales
      const topVendors = this.vendorStats.slice(0, 3);
      const topAdminCanales = this.adminCanalStats.slice(0, 2);

      labels = [
        ...topVendors.map(v => v.nombre),
        ...topAdminCanales.map(a => a.nombre)
      ];

      dataTotales = [
        ...topVendors.map(v => v.totalOperaciones),
        ...topAdminCanales.map(a => a.totalOperaciones)
      ];

      dataLiquidadas = [
        ...topVendors.map(v => v.operacionesLiquidadas),
        ...topAdminCanales.map(a => a.operacionesLiquidadas)
      ];
    }

    if (this.comparacionChart) {
      this.comparacionChart.destroy();
    }

    this.comparacionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Operaciones',
            data: dataTotales,
            backgroundColor: 'rgba(0, 158, 247, 0.7)',
            borderColor: 'rgba(0, 158, 247, 1)',
            borderWidth: 1
          },
          {
            label: 'Operaciones Liquidadas',
            data: dataLiquidadas,
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

  // Helper methods
  groupOperacionesPorMes(): {meses: string[], totales: number[], liquidadas: number[]} {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const operacionesPorMes = new Map();
    const operacionesLiquidadasPorMes = new Map();

    // Inicializar todos los meses con 0
    meses.forEach(mes => {
      operacionesPorMes.set(mes, 0);
      operacionesLiquidadasPorMes.set(mes, 0);
    });

    // Si no hay operaciones, devolver datos de muestra
    if (!this.operaciones || this.operaciones.length === 0) {
      return {
        meses: meses.slice(0, 6),
        totales: Array(6).fill(0),
        liquidadas: Array(6).fill(0)
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
      }
    });

    // Obtener los últimos 6 meses
    const mesesRecientes = meses.slice(0, 6);
    const totales = mesesRecientes.map(mes => operacionesPorMes.get(mes) || 0);
    const liquidadas = mesesRecientes.map(mes => operacionesLiquidadasPorMes.get(mes) || 0);

    return { meses: mesesRecientes, totales, liquidadas };
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
}
