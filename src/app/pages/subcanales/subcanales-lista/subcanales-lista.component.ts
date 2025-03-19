import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { SubcanalFormComponent } from 'src/app/shared/modals/subcanal-form/subcanal-form.component';
import { ModalEditarSubcanalComponent } from 'src/app/shared/modals/modal-editar-subcanal/modal-editar-subcanal.component';
import { ModalVerSubcanalComponent } from 'src/app/shared/modals/modal-ver-subcanal/modal-ver-subcanal.component';

// Tipo para ordenamiento
interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-subcanales-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    IonicModule,
    SubcanalFormComponent,
    ModalEditarSubcanalComponent,
    ModalVerSubcanalComponent
  ],
  templateUrl: './subcanales-lista.component.html',
  styleUrls: ['./subcanales-lista.component.scss']
})
export class SubcanalesListaComponent implements OnInit {
  subcanales: Subcanal[] = [];
  filteredSubcanales: Subcanal[] = []; // Lista filtrada para mostrar
  loading = false;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  subcanalIdEditar: number | null = null;
  subcanalIdVer: number | null = null;
  scrollbarWidth: number = 0;

  // Búsqueda y ordenamiento
  searchTerm: string = '';
  searchTimeout: any;
  sortState: SortState = { column: '', direction: 'asc' };

  constructor(
    private subcanalService: SubcanalService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.loadSubcanales();
    // Calcular el ancho de la barra de desplazamiento
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  }

  loadSubcanales() {
    // Si ya está cargando, no hacer nada
    if (this.loading) return;

    this.loading = true;
    console.log('Cargando lista de subcanales...');

    this.subcanalService.getSubcanales().subscribe({
      next: (data) => {
        this.subcanales = data;
        this.applyFilters(); // Aplicar filtros y ordenamiento iniciales
        console.log(`${data.length} subcanales cargados`);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar subcanales:', err);
        this.error = 'No se pudieron cargar los subcanales. Por favor, intente nuevamente.';
        this.loading = false;
      }
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
    let result = [...this.subcanales];

    // Aplicar búsqueda si hay término
    if (this.searchTerm && this.searchTerm.length >= 3) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(subcanal =>
        subcanal.nombre.toLowerCase().includes(term) ||
        subcanal.canalNombre.toLowerCase().includes(term)
      );
    }

    // Aplicar ordenamiento si está configurado
    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredSubcanales = result;
  }

  // Ordenar los datos según la columna seleccionada
  sortData(data: Subcanal[]): Subcanal[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      // Para ordenar por ID (numérico)
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      // Para texto (nombre, provincia)
      else if (column === 'nombre' || column === 'provincia') {
        const valueA = (a[column] || '').toLowerCase();
        const valueB = (b[column] || '').toLowerCase();
        return valueA.localeCompare(valueB) * factor;
      }
      // Para ordenar por estado (activo/inactivo)
      else if (column === 'activo') {
        return (a[column] === b[column] ? 0 : a[column] ? -1 : 1) * factor;
      }
      // Para ordenar por porcentaje de gastos
      else if (column === 'gastos') {
        // Extraer el valor numérico del porcentaje
        const getGastoValue = (subcanal: Subcanal) => {
          const gastoStr = this.getGastosPorcentaje(subcanal);
          return parseFloat(gastoStr.replace('%', '')) || 0;
        };
        return (getGastoValue(a) - getGastoValue(b)) * factor;
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

  // Navegar al detalle del subcanal
  verDetalle(id: number): void {
    console.log(`Abriendo detalle del subcanal ${id}`);
    // Primero establecemos el ID
    this.subcanalIdVer = id;

    // Luego abrimos el modal (setTimeout para evitar doble carga)
    setTimeout(() => {
      this.modalVerOpen = true;
      this.manejarAperturaModal();
    }, 0);
  }

  // Abrir modal para editar subcanal
  abrirModalEditarSubcanal(id: number): void {
    console.log(`Abriendo modal para editar subcanal ${id}`);
    // Primero asignamos el ID
    this.subcanalIdEditar = id;

    // Luego abrimos el modal (esto evita múltiples cargas)
    setTimeout(() => {
      this.modalEditarOpen = true;
      this.manejarAperturaModal();
    }, 0);
  }

  // Cierra el modal de visualización
  cerrarModalVer() {
    console.log('Cerrando modal de visualización');
    this.modalVerOpen = false;
    this.subcanalIdVer = null;
    this.manejarCierreModal();
  }

  // Cierra el modal de edición
  cerrarModalEditar() {
    console.log('Cerrando modal de edición');
    this.modalEditarOpen = false;
    this.subcanalIdEditar = null;
    this.manejarCierreModal();
  }

  // Maneja la solicitud de edición desde el modal de visualización
  onEditarSolicitado(id: number) {
    console.log(`Solicitando editar subcanal ${id} desde modal de visualización`);
    // Cerrar modal de visualización
    this.modalVerOpen = false;
    this.subcanalIdVer = null;

    // Abrir modal de edición
    setTimeout(() => {
      this.abrirModalEditarSubcanal(id);
    }, 300); // Pequeño retraso para evitar superposición de modales
  }

  // Calcular el porcentaje total de gastos
  getGastosPorcentaje(subcanal: Subcanal): string {
    if (!subcanal.gastos || subcanal.gastos.length === 0) {
      return '0%';
    }

    const totalPorcentaje = subcanal.gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);
    return `${totalPorcentaje}%`;
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Abre el modal para nuevo subcanal
  abrirModalNuevoSubcanal() {
    console.log('Abriendo modal para nuevo subcanal');
    this.modalOpen = true;
    this.manejarAperturaModal();
  }

  // Cierra el modal de creación
  cerrarModal() {
    console.log('Cerrando modal de creación');
    this.modalOpen = false;
    this.manejarCierreModal();
  }

  // Maneja la creación de un subcanal
  onSubcanalCreado(subcanal: Subcanal) {
    console.log('Subcanal creado:', subcanal);
    this.loadSubcanales(); // Recargar lista completa para asegurar datos actualizados
  }

  // Maneja la actualización de un subcanal
  onSubcanalActualizado(subcanal: Subcanal) {
    console.log('Subcanal actualizado:', subcanal);
    this.loadSubcanales(); // Recargar lista completa para asegurar datos actualizados
  }

  // Funciones helper para manejar estilos del body
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
    if (!this.modalOpen && !this.modalEditarOpen && !this.modalVerOpen) {
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
