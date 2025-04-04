// src/app/pages/canales/canales-lista/canales-lista.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { CanalFormComponent } from 'src/app/shared/modals/canal-form/canal-form.component';
import { ModalEditarCanalComponent } from 'src/app/shared/modals/modal-editar-canal/modal-editar-canal.component';
import { ModalVerCanalComponent } from 'src/app/shared/modals/modal-ver-canal/modal-ver-canal.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { Router } from '@angular/router';

// Tipo para ordenamiento
interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-canales-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    IonicModule,
    CanalFormComponent,
    ModalEditarCanalComponent,
    ModalVerCanalComponent
  ],
  templateUrl: './canales-lista.component.html',
  styleUrls: ['./canales-lista.component.scss']
})
export class CanalesListaComponent implements OnInit, OnDestroy {
  canales: Canal[] = [];
  filteredCanales: Canal[] = []; // Lista filtrada para mostrar
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  canalIdEditar: number | null = null;
  canalIdVer: number | null = null;

  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;


  // Búsqueda, filtrado y ordenamiento
  searchTerm: string = '';
  searchTimeout: any;
  filterActive: string = 'all'; // 'all', 'active', 'inactive'
  sortState: SortState = { column: 'id', direction: 'asc' };

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalCanales: number = 0;
  totalPaginas: number = 1;

  paginatedCanales: Canal[] = []; // Lista paginada para mostrar


  constructor(
    private canalService: CanalService,
    private renderer: Renderer2,
    private sidebarStateService: SidebarStateService,
    private router: Router
  ) { }

  ngOnInit() {
    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        this.isSidebarCollapsed = collapsed;
        this.adjustContentArea();
      }
    );

    // Inicializar paginación
    this.paginaActual = 1;
    this.itemsPorPagina = 10;

    // Load canales only once
    this.loadCanales();
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

  loadCanales() {
    this.loading = true;
    console.log('Loading canales...');
    this.canalService.getCanales().subscribe({
      next: (data) => {
        console.log(`Loaded ${data.length} canales`);
        this.canales = data;
        this.totalCanales = data.length;
        this.applyFilters(); // Aplicar filtros y ordenamiento iniciales
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar canales:', err);
        this.error = 'No se pudieron cargar los canales. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  // Funciones para búsqueda
  onSearchChange() {
    // Debounce para evitar muchas búsquedas mientras el usuario escribe
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.paginaActual = 1; // Volver a la primera página al buscar
      this.applyFilters();
    }, 300);
  }

  clearSearch() {
    this.searchTerm = '';
    this.paginaActual = 1; // Volver a la primera página al limpiar la búsqueda
    this.applyFilters();
  }
  // Aplicar filtros, búsqueda y ordenamiento a la lista
  applyFilters() {
    console.log('Applying filters. Search term:', this.searchTerm);
    let result = [...this.canales];

    // Aplicar búsqueda si hay término
    if (this.searchTerm && this.searchTerm.length >= 2) {
      const term = this.searchTerm.toLowerCase();
      console.log(`Filtering by term: "${term}"`);
      result = result.filter(canal =>
        canal.nombreFantasia?.toLowerCase().includes(term) ||
        canal.razonSocial?.toLowerCase().includes(term) ||
        canal.tipoCanal?.toLowerCase().includes(term) ||
        (canal.provincia && canal.provincia.toLowerCase().includes(term))
      );
      console.log(`After filtering: ${result.length} results`);
    }

    // Aplicar filtro por estado
    if (this.filterActive === 'active') {
      result = result.filter(canal => canal.activo);
    } else if (this.filterActive === 'inactive') {
      result = result.filter(canal => !canal.activo);
    }

    // Aplicar ordenamiento si está configurado
    if (this.sortState.column) {
      result = this.sortData(result);
    }

    // Actualizar canales filtrados
    this.filteredCanales = result;
    console.log(`Final filtered results: ${this.filteredCanales.length}`);

    // Actualizar total de canales y recalcular paginación
    this.totalCanales = this.filteredCanales.length;
    this.calcularTotalPaginas();
    this.paginarCanales();
  }
  calcularTotalPaginas() {
    this.totalPaginas = Math.ceil(this.filteredCanales.length / this.itemsPorPagina);

    // Si la página actual es mayor que el total de páginas, ir a la última página
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
  }

  // Paginar los canales
  paginarCanales() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = Math.min(inicio + this.itemsPorPagina, this.filteredCanales.length);

    this.paginatedCanales = this.filteredCanales.slice(inicio, fin);
  }

  // Cambiar de página
  cambiarPagina(pagina: any) {
    // Asegurarse de que pagina es un número
    const paginaNum = Number(pagina);

    // Verificar si es un número válido
    if (isNaN(paginaNum) || paginaNum < 1 || paginaNum > this.totalPaginas) {
      return;
    }

    this.paginaActual = paginaNum;
    this.paginarCanales();
  }

  // Obtener el array de páginas a mostrar (con elipsis para muchas páginas)
  obtenerPaginas(): (number | string)[] {
    const paginasMostradas = 5; // Número máximo de páginas a mostrar
    let paginas: (number | string)[] = [];

    if (this.totalPaginas <= paginasMostradas) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= this.totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Si hay muchas páginas, mostrar con elipsis

      // Siempre incluir la primera página
      paginas.push(1);

      // Calcular inicio y fin del rango central
      let inicio = Math.max(2, this.paginaActual - 1);
      let fin = Math.min(this.totalPaginas - 1, this.paginaActual + 1);

      // Ajustar para mostrar siempre 3 páginas en el centro
      if (inicio === 2) fin = Math.min(4, this.totalPaginas - 1);
      if (fin === this.totalPaginas - 1) inicio = Math.max(2, this.totalPaginas - 3);

      // Agregar elipsis antes del rango si es necesario
      if (inicio > 2) paginas.push('...');

      // Agregar el rango de páginas
      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }

      // Agregar elipsis después del rango si es necesario
      if (fin < this.totalPaginas - 1) paginas.push('...');

      // Siempre incluir la última página
      paginas.push(this.totalPaginas);
    }

    return paginas;
  }




  // Resto del código permanece igual...

  // Ordenar los datos según la columna seleccionada
  sortData(data: Canal[]): Canal[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      // Para ordenar por ID (numérico)
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      // Para texto (nombre, provincia)
      else if (column === 'nombreFantasia' || column === 'tipoCanal') {
        const valueA = (a[column] || '').toLowerCase();
        const valueB = (b[column] || '').toLowerCase();
        return valueA.localeCompare(valueB) * factor;
      }
      // Para ordenar por estado (activo/inactivo)
      else if (column === 'activo') {
        return (a[column] === b[column] ? 0 : a[column] ? -1 : 1) * factor;
      }
      // Para ordenar por cantidad de planes
      else if (column === 'planes') {
        const countA = this.getPlanesCantidad(a);
        const countB = this.getPlanesCantidad(b);
        return (countA - countB) * factor;
      }
      // Para ordenar por cantidad de subcanales
      else if (column === 'subcanales') {
        const countA = this.getSubcanalesCantidad(a);
        const countB = this.getSubcanalesCantidad(b);
        return (countA - countB) * factor;
      }
      // Para ordenar por fecha de alta
      else if (column === 'fechaAlta') {
        const dateA = a.fechaAlta ? new Date(a.fechaAlta).getTime() : 0;
        const dateB = b.fechaAlta ? new Date(b.fechaAlta).getTime() : 0;
        return (dateA - dateB) * factor;
      }
      // Para ordenar por operaciones
      else if (column === 'operaciones') {
        const countA = a.numeroOperaciones || 0;
        const countB = b.numeroOperaciones || 0;
        return (countA - countB) * factor;
      }

      return 0;
    });
  }

  sortBy(column: string) {
    // Si es la misma columna, cambiar dirección, si no, ordenar asc por la nueva columna
    if (this.sortState.column === column) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState = { column, direction: 'asc' };
    }

    this.paginaActual = 1; // Volver a la primera página al cambiar el ordenamiento
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

  // Obtener iniciales para el avatar
  getInitials(name: string): string {
    if (!name) return '';

    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }

  // Navegar al detalle del canal
  verDetalle(id: number): void {
    this.router.navigate(['/canales', id]);
  }

  // Abrir modal para editar canal
  abrirModalEditarCanal(id: number): void {
    this.canalIdEditar = id;
    this.modalEditarOpen = true;
    this.manejarAperturaModal();
  }

  // Cierra el modal de visualización
  cerrarModalVer() {
    this.modalVerOpen = false;
    this.canalIdVer = null;
    this.manejarCierreModal();
  }

  // Cierra el modal de edición
  cerrarModalEditar() {
    this.modalEditarOpen = false;
    this.canalIdEditar = null;
    this.manejarCierreModal();
  }

  // Maneja la solicitud de edición desde el modal de visualización
  onEditarSolicitado(id: number) {
    // Cerrar modal de visualización
    this.modalVerOpen = false;
    this.canalIdVer = null;

    // Abrir modal de edición
    setTimeout(() => {
      this.abrirModalEditarCanal(id);
    }, 300); // Pequeño retraso para evitar superposición de modales
  }

  // Devuelve el conteo de planes activos
  getPlanesCantidad(canal: Canal): number {
    return canal.planesCanal?.filter(pc => pc.activo)?.length || 0;
  }

  // Devuelve la cantidad de subcanales
  getSubcanalesCantidad(canal: Canal): number {
    return canal.subcanales?.length || 0;
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Abre el modal para nuevo canal
  abrirModalNuevoCanal() {
    this.modalOpen = true;
    this.manejarAperturaModal();
  }

  // Cierra el modal de creación
  cerrarModal() {
    this.modalOpen = false;
    this.manejarCierreModal();
  }

  // Maneja la creación de un canal
  onCanalCreado(canal: Canal) {
    this.paginaActual = 1; // Volver a la primera página
    this.loadCanales(); // Recargar lista completa para asegurar datos actualizados
  }
  // Maneja la actualización de un canal
  onCanalActualizado(canal: Canal) {
    this.loadCanales(); // Recargar lista completa para asegurar datos actualizados
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
