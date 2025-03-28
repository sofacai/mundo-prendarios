import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { OperacionService } from 'src/app/core/services/operacion.service';
import { ModalVerOperacionComponent } from "../../../shared/modals/modal-ver-operaciones/modal-ver-operaciones.component";

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
export class OperacionesListaComponent implements OnInit {
  operaciones: OperacionDto[] = [];
  filteredOperaciones: OperacionDto[] = []; // Lista filtrada para mostrar
  loading = true;
  error: string | null = null;

  // Búsqueda y ordenamiento
  searchTerm: string = '';
  searchTimeout: any;
  sortState: SortState = { column: '', direction: 'asc' };

  constructor(
    private router: Router,
    private operacionService: OperacionService
  ) { }

  ngOnInit() {
    this.loadOperaciones();
  }

  loadOperaciones() {
    this.loading = true;
    this.error = null;

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

        this.applyFilters();
      });
  }

  // Funciones para búsqueda
  onSearchChange() {
    // Debounce para evitar muchas búsquedas mientras el usuario escribe
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Aplicar filtros y ordenamiento a la lista
  applyFilters() {
    let result = [...this.operaciones];

    // Aplicar búsqueda si hay término
    if (this.searchTerm && this.searchTerm.length >= 3) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(operacion =>
        operacion.nombreCliente.toLowerCase().includes(term) ||
        operacion.apellidoCliente.toLowerCase().includes(term) ||
        operacion.plan.toLowerCase().includes(term)
      );
    }

    // Aplicar ordenamiento si está configurado
    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredOperaciones = result;
  }

  // Ordenar los datos según la columna seleccionada
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
      const nombreA = `${a.nombreCliente} ${a.apellidoCliente}`.toLowerCase();
      const nombreB = `${b.nombreCliente} ${b.apellidoCliente}`.toLowerCase();
      return nombreA.localeCompare(nombreB) * factor;
    }
    // Para ordenar por plan
    else if (column === 'plan') {
      return a.plan.toLowerCase().localeCompare(b.plan.toLowerCase()) * factor;
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
      return a.fechaCreacion.localeCompare(b.fechaCreacion) * factor;
    }
    // Para ordenar por canal
    else if (column === 'canal') {
      return a.canal.toLowerCase().localeCompare(b.canal.toLowerCase()) * factor;
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
  }

  // Variables para controlar el modal
  operacionIdSeleccionada: number | null = null;
  modalVerOperacionOpen = false;

  // Método para cerrar el modal
  cerrarModalVerOperacion() {
    this.modalVerOperacionOpen = false;
    this.operacionIdSeleccionada = null;
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
}
