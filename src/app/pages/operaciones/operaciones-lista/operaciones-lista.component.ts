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
  canal?: string;
}

// Tipo para ordenamiento
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
  filteredOperaciones: OperacionDto[] = []; // Lista filtrada para mostrar
  loading = true;
  error: string | null = null;

  // Sidebar collapsed state
  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  // Búsqueda y ordenamiento
  searchTerm: string = '';
  searchTimeout: any;
  filterActive: string = 'all'; // 'all', 'active', 'pending', 'completed', 'cancelled'
  sortState: SortState = { column: '', direction: 'asc' };

  // Variables para controlar el modal
  operacionIdSeleccionada: number | null = null;
  modalVerOperacionOpen = false;

  constructor(
    private router: Router,
    private operacionService: OperacionService,
    private renderer: Renderer2,
    private sidebarStateService: SidebarStateService
  ) { }

  ngOnInit() {
    // Initialize sidebar state
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
        contentArea.style.marginLeft = '70px'; // Ancho del sidebar colapsado
      } else {
        contentArea.style.marginLeft = '260px'; // Ancho del sidebar expandido
      }
    }
  }

  loadOperaciones() {
    this.loading = true;
    this.error = null;
    console.log('Cargando lista de operaciones...');

    this.operacionService.getOperaciones()
      .pipe(
        catchError(error => {
          console.error('Error al cargar operaciones:', error);
          this.error = 'No se pudieron cargar las operaciones. Por favor, intente nuevamente.';
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(operaciones => {
        // Transformar datos del API al formato del componente
        this.operaciones = operaciones.map((op: any) => {
          // Obtener nombre y apellido del cliente
          let nombre = '';
          let apellido = '';

          if (op.clienteNombre) {
            const partes = op.clienteNombre.trim().split(' ');
            nombre = partes[0] || '';
            apellido = partes.slice(1).join(' ') || '';
          }

          // Determinar estado basado en lógica de negocio
          let estado = 'Activo';

          // Formatear fecha
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
            nombreCliente: nombre,
            apellidoCliente: apellido,
            plan: op.planNombre || '',
            meses: op.meses || 0,
            gasto: op.tasa || 0,
            monto: op.monto || 0,
            estado: estado,
            fechaCreacion: fechaCreacion,
            canal: op.canalNombre || 'Sin canal'
          };
        });

        console.log(`${operaciones.length} operaciones cargadas`);
        this.applyFilters();
      });
  }

  // Funciones para búsqueda
  onSearchChange() {
    // Debounce para evitar muchas búsquedas mientras el usuario escribe
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      console.log(`Searching for: "${this.searchTerm}"`);
      this.applyFilters();
    }, 300);
  }

  clearSearch() {
    console.log('Clearing search');
    this.searchTerm = '';
    this.applyFilters();
  }

  // Aplicar filtros y ordenamiento a la lista
  applyFilters() {
    console.log('Applying filters. Search term:', this.searchTerm);
    let result = [...this.operaciones];

    // Aplicar búsqueda si hay término
    if (this.searchTerm && this.searchTerm.length >= 3) {
      const term = this.searchTerm.toLowerCase();
      console.log(`Filtering by term: "${term}"`);
      result = result.filter(operacion =>
        (operacion.nombreCliente?.toLowerCase() || '').includes(term) ||
        (operacion.apellidoCliente?.toLowerCase() || '').includes(term) ||
        (operacion.plan?.toLowerCase() || '').includes(term) ||
        (operacion.canal?.toLowerCase() || '').includes(term)
      );
      console.log(`After filtering: ${result.length} results`);
    }

    // Aplicar filtro por estado si no es 'all'
    if (this.filterActive !== 'all') {
      const estadoFiltro = this.filterActive.charAt(0).toUpperCase() + this.filterActive.slice(1);
      result = result.filter(operacion => operacion.estado === estadoFiltro);
    }

    // Aplicar ordenamiento si está configurado
    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredOperaciones = result;
    console.log(`Final filtered results: ${this.filteredOperaciones.length}`);
  }

  // Ordenar los datos según la columna seleccionada
  sortData(data: OperacionDto[]): OperacionDto[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      // Para ordenar por ID (numérico)
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      // Para ordenar por nombre completo
      else if (column === 'nombreCompleto') {
        const nombreA = `${a.nombreCliente || ''} ${a.apellidoCliente || ''}`.toLowerCase();
        const nombreB = `${b.nombreCliente || ''} ${b.apellidoCliente || ''}`.toLowerCase();
        return nombreA.localeCompare(nombreB) * factor;
      }
      // Para ordenar por plan
      else if (column === 'plan') {
        return (a.plan || '').toLowerCase().localeCompare((b.plan || '').toLowerCase()) * factor;
      }
      // Para ordenar por meses
      else if (column === 'meses') {
        return (a.meses - b.meses) * factor;
      }
      // Para ordenar por gasto
      else if (column === 'gasto') {
        return (a.gasto - b.gasto) * factor;
      }
      // Para ordenar por monto
      else if (column === 'monto') {
        return (a.monto - b.monto) * factor;
      }
      // Para ordenar por fecha de creación
      else if (column === 'fechaCreacion') {
        return (a.fechaCreacion || '').localeCompare((b.fechaCreacion || '')) * factor;
      }
      // Para ordenar por canal
      else if (column === 'canal') {
        return (a.canal || '').toLowerCase().localeCompare((b.canal || '').toLowerCase()) * factor;
      }
      // Para ordenar por estado
      else if (column === 'estado') {
        // Orden personalizado para estados
        const estadoOrden: {[key: string]: number} = {
          'Activo': 1,
          'Pendiente': 2,
          'Completado': 3,
          'Cancelado': 4
        };
        const ordenA = estadoOrden[a.estado] || 99;
        const ordenB = estadoOrden[b.estado] || 99;
        return (ordenA - ordenB) * factor;
      }

      return 0;
    });
  }

  // Cambiar el ordenamiento cuando se hace clic en una columna
  sortBy(column: string) {
    // Si es la misma columna, cambiar dirección, si no, ordenar asc por la nueva columna
    if (this.sortState.column === column) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState = { column, direction: 'asc' };
    }

    this.applyFilters();
  }

  // Obtener el icono para la columna de ordenamiento
  getSortIcon(column: string): string {
    if (this.sortState.column !== column) {
      return 'bi-arrow-down-up text-muted';
    }

    return this.sortState.direction === 'asc'
      ? 'bi-sort-down-alt'
      : 'bi-sort-up-alt';
  }

  verDetalle(id: number): void {
    console.log(`Ver detalle de la operación ${id}`);
    this.operacionIdSeleccionada = id;
    this.modalVerOperacionOpen = true;
    this.manejarAperturaModal();
  }

  // Método para cerrar el modal
  cerrarModalVerOperacion() {
    this.modalVerOperacionOpen = false;
    this.operacionIdSeleccionada = null;
    this.manejarCierreModal();
  }

  getEstadoClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'badge-success';
      case 'pendiente':
        return 'badge-warning';
      case 'completado':
        return 'badge-info';
      case 'cancelado':
        return 'badge-danger';
      default:
        return 'badge-light';
    }
  }

  formatNumber(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Funciones helper para manejar estilos del body al abrir modal
  private manejarAperturaModal() {
    // Añadir clase al cuerpo para mantener la barra de desplazamiento
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      this.renderer.addClass(contentArea, 'content-area-with-modal');
      // Fijar la posición del body para evitar desplazamiento
      this.renderer.setStyle(document.body, 'position', 'fixed');
      this.renderer.setStyle(document.body, 'width', '100%');
      this.renderer.setStyle(document.body, 'overflow-y', 'scroll');
    }
  }

  private manejarCierreModal() {
    // Solo restaurar si no hay ningún otro modal abierto
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
}
