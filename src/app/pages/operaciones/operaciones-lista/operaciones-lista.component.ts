import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { OperacionService } from 'src/app/core/services/operacion.service';
import { ModalVerOperacionComponent } from "../../../shared/modals/modal-ver-operaciones/modal-ver-operaciones.component";
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { AuthService } from 'src/app/core/services/auth.service';

export interface OperacionDto {
  id: number;
  nombreCliente: string;
  apellidoCliente: string;
  plan: string;
  meses: number;
  gasto: number;
  monto: number;
  estado: string;
  fechaCreacion?: string;
  canalId?: number;
  canalNombre?: string;
}

interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-operaciones-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    IonicModule,
    ModalVerOperacionComponent
  ],
  templateUrl: './operaciones-lista.component.html',
  styleUrls: ['./operaciones-lista.component.scss']
})
export class OperacionesListaComponent implements OnInit, OnDestroy {
  operaciones: OperacionDto[] = [];
  filteredOperaciones: OperacionDto[] = [];
  paginatedOperaciones: OperacionDto[] = [];
  loading = true;
  error: string | null = null;

  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  searchTerm: string = '';
  searchTimeout: any;
  filterActive: string = 'all';
  sortState: SortState = { column: '', direction: 'asc' };

  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalOperaciones: number = 0;
  totalPaginas: number = 1;

  operacionIdSeleccionada: number | null = null;
  modalVerOperacionOpen = false;

  showDeleteModal = false;
operacionAEliminar: OperacionDto | null = null;
eliminandoOperacion = false;
isAdmin = false;

  constructor(
    private router: Router,
    private operacionService: OperacionService,
    private authService: AuthService,
    private renderer: Renderer2,
    private sidebarStateService: SidebarStateService
  ) { }

  ngOnInit() {
      this.isAdmin = this.authService.isAdmin();

    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        this.isSidebarCollapsed = collapsed;
        this.adjustContentArea();
      }
    );

    this.loadOperaciones();
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
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

  loadOperaciones() {
    this.loading = true;
    this.error = null;

    this.operacionService.getOperaciones()
      .pipe(
        catchError(error => {
          this.error = 'No se pudieron cargar las operaciones. Por favor, intente nuevamente.';
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(operaciones => {
        this.operaciones = operaciones.map((op: any) => {
          let nombre = '';
          let apellido = '';

          if (op.clienteNombre) {
            const partes = op.clienteNombre.trim().split(' ');
            nombre = partes[0] || '';
            apellido = partes.slice(1).join(' ') || '';
          }

          let estado = op.estado || 'Ingresada';

          let fechaCreacion = '';
          if (op.fechaCreacion) {
            try {
              const fecha = new Date(op.fechaCreacion);
              fechaCreacion = fecha.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            } catch (e) {
              fechaCreacion = 'Fecha inválida';
            }
          }

          return {
            id: op.id || 0,
            nombreCliente: op.clienteNombre || nombre,
            apellidoCliente: op.clienteApellido || apellido,
            plan: op.planNombre || '',
            meses: op.meses || 0,
            gasto: op.tasa || 0,
            monto: op.monto || 0,
            estado: estado,
            fechaCreacion: fechaCreacion,
            canalNombre: op.canalNombre || 'Sin canal',
            canalId: op.canalId,
          };
        });

        // Set default sort to show operations with highest ID first
        this.sortState = { column: 'id', direction: 'desc' };

        this.applyFilters();
      });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.paginaActual = 1;
      this.applyFilters();
    }, 300);
  }

  clearSearch() {
    this.searchTerm = '';
    this.paginaActual = 1;
    this.applyFilters();
  }


  applyFilters() {
    let result = [...this.operaciones];

    if (this.searchTerm && this.searchTerm.length >= 3) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(operacion =>
        (operacion.nombreCliente?.toLowerCase() || '').includes(term) ||
        (operacion.apellidoCliente?.toLowerCase() || '').includes(term) ||
        (operacion.plan?.toLowerCase() || '').includes(term) ||
        (operacion.canalNombre?.toLowerCase() || '').includes(term)
      );
    }

    if (this.filterActive !== 'all') {
      // Asegurar que la comparación no sea sensible a mayúsculas/minúsculas
      const filtroLower = this.filterActive.toLowerCase();
      result = result.filter(operacion => {
        const estadoLower = operacion.estado?.toLowerCase() || '';
        return estadoLower === filtroLower;
      });
    }

    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredOperaciones = result;
    this.totalOperaciones = this.filteredOperaciones.length;
    this.calcularTotalPaginas();
    this.paginarOperaciones();
  }

  calcularTotalPaginas() {
    this.totalPaginas = Math.ceil(this.filteredOperaciones.length / this.itemsPorPagina);

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
  }

  paginarOperaciones() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = Math.min(inicio + this.itemsPorPagina, this.filteredOperaciones.length);

    this.paginatedOperaciones = this.filteredOperaciones.slice(inicio, fin);
  }

  cambiarPagina(pagina: any) {
    const paginaNum = Number(pagina);

    if (isNaN(paginaNum) || paginaNum < 1 || paginaNum > this.totalPaginas) {
      return;
    }

    this.paginaActual = paginaNum;
    this.paginarOperaciones();
  }

  obtenerPaginas(): (number | string)[] {
    const paginasMostradas = 5;
    let paginas: (number | string)[] = [];

    if (this.totalPaginas <= paginasMostradas) {
      for (let i = 1; i <= this.totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);

      let inicio = Math.max(2, this.paginaActual - 1);
      let fin = Math.min(this.totalPaginas - 1, this.paginaActual + 1);

      if (inicio === 2) fin = Math.min(4, this.totalPaginas - 1);
      if (fin === this.totalPaginas - 1) inicio = Math.max(2, this.totalPaginas - 3);

      if (inicio > 2) paginas.push('...');

      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }

      if (fin < this.totalPaginas - 1) paginas.push('...');

      paginas.push(this.totalPaginas);
    }

    return paginas;
  }

  sortData(data: OperacionDto[]): OperacionDto[] {
    const { column, direction } = this.sortState;

    if (!column) {
      return data;
    }

    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }

      if (column === 'nombreCompleto') {
        const nombreA = `${a.nombreCliente} ${a.apellidoCliente}`.toLowerCase();
        const nombreB = `${b.nombreCliente} ${b.apellidoCliente}`.toLowerCase();
        return nombreA.localeCompare(nombreB) * factor;
      }

      if (column === 'plan') {
        return (a.plan || '').localeCompare(b.plan || '') * factor;
      }

      if (column === 'meses') {
        return (a.meses - b.meses) * factor;
      }

      if (column === 'gasto') {
        return (a.gasto - b.gasto) * factor;
      }

      if (column === 'monto') {
        return (a.monto - b.monto) * factor;
      }

      if (column === 'fechaCreacion') {
        const dateA = a.fechaCreacion ? new Date(a.fechaCreacion.split('/').reverse().join('-')) : new Date(0);
        const dateB = b.fechaCreacion ? new Date(b.fechaCreacion.split('/').reverse().join('-')) : new Date(0);
        return (dateA.getTime() - dateB.getTime()) * factor;
      }

      if (column === 'canalNombre') {
        return (a.canalNombre || '').localeCompare(b.canalNombre || '') * factor;
      }

      if (column === 'estado') {
        const estadoOrden: {[key: string]: number} = {
          'Liquidada': 0,
          'Ingresada': 1,
          'Activo': 2,
          'Pendiente': 3,
          'Completado': 4,
          'Cancelado': 5
        };
        const ordenA = estadoOrden[a.estado] || 99;
        const ordenB = estadoOrden[b.estado] || 99;
        return (ordenA - ordenB) * factor;
      }

      return 0;
    });
  }

  sortBy(column: string) {
    if (this.sortState.column === column) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState = { column, direction: 'asc' };
    }

    this.paginaActual = 1;
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortState.column !== column) {
      return 'bi-arrow-down-up text-muted';
    }

    return this.sortState.direction === 'asc'
      ? 'bi-sort-down-alt'
      : 'bi-sort-up-alt';
  }

  verDetalle(id: number): void {
    this.router.navigate(['/operaciones', id]);
  }

  verDetalleCanal(id: number): void {
    this.router.navigate(['/canales', id]);
  }

  cerrarModalVerOperacion() {
    this.modalVerOperacionOpen = false;
    this.operacionIdSeleccionada = null;
    this.manejarCierreModal();
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'badge-light';
    return this.operacionService.getEstadoClass(estado);
  }

  formatNumber(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  private manejarAperturaModal() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      this.renderer.addClass(contentArea, 'content-area-with-modal');
      this.renderer.setStyle(document.body, 'position', 'fixed');
      this.renderer.setStyle(document.body, 'width', '100%');
      this.renderer.setStyle(document.body, 'overflow-y', 'scroll');
    }
  }

  private manejarCierreModal() {
    if (!this.modalVerOperacionOpen) {
      const contentArea = document.querySelector('.content-area') as HTMLElement;
      if (contentArea) {
        this.renderer.removeClass(contentArea, 'content-area-with-modal');
        this.renderer.removeStyle(document.body, 'position');
        this.renderer.removeStyle(document.body, 'width');
        this.renderer.removeStyle(document.body, 'overflow-y');
      }
    }
  }

  eliminarOperacion(operacionId: number, event: Event): void {
  event.stopPropagation(); // Evitar que se active el click de la fila

  const operacion = this.paginatedOperaciones.find(op => op.id === operacionId);
  if (operacion) {
    this.operacionAEliminar = operacion;
    this.showDeleteModal = true;
    this.manejarAperturaModal();
  }
}

cancelarEliminacion(): void {
  this.showDeleteModal = false;
  this.operacionAEliminar = null;
  this.manejarCierreModal();
}

confirmarEliminacion(): void {
  if (!this.operacionAEliminar) return;

  this.eliminandoOperacion = true;

  this.operacionService.eliminarOperacion(this.operacionAEliminar.id)
    .pipe(
      catchError(error => {
        console.error('Error al eliminar operación:', error);
        this.error = 'No se pudo eliminar la operación. Por favor, intente nuevamente.';
        return of(null);
      }),
      finalize(() => {
        this.eliminandoOperacion = false;
      })
    )
    .subscribe(response => {
      if (response !== null) {
        // Eliminación exitosa
        this.showDeleteModal = false;
        this.operacionAEliminar = null;
        this.manejarCierreModal();

        // Recargar la lista de operaciones
        this.loadOperaciones();

        // Opcional: mostrar mensaje de éxito
        console.log('Operación eliminada correctamente');
      }
    });
}
}
