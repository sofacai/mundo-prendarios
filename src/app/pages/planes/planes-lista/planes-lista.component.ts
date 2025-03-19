import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { PlanService, Plan } from 'src/app/core/services/plan.service';
import { PlanFormComponent } from 'src/app/shared/modals/plan-form/plan-form.component';
import { ModalEditarPlanComponent } from 'src/app/shared/modals/modal-editar-plan/modal-editar-plan.component';
import { ModalVerPlanComponent } from 'src/app/shared/modals/modal-ver-plan/modal-ver-plan.component';

// Tipo para ordenamiento
interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-planes-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    IonicModule,
    PlanFormComponent,
    ModalEditarPlanComponent,
    ModalVerPlanComponent
  ],
  templateUrl: './planes-lista.component.html',
  styleUrls: ['./planes-lista.component.scss']
})
export class PlanesListaComponent implements OnInit {
  planes: Plan[] = [];
  filteredPlanes: Plan[] = []; // Lista filtrada para mostrar
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  planIdEditar: number | null = null;
  planIdVer: number | null = null;
  scrollbarWidth: number = 0;

  // Búsqueda y ordenamiento
  searchTerm: string = '';
  searchTimeout: any;
  sortState: SortState = { column: '', direction: 'asc' };

  constructor(
    private planService: PlanService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.loadPlanes();
    // Calcular el ancho de la barra de desplazamiento
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  }

  loadPlanes() {
    this.loading = true;
    this.planService.getPlanes().subscribe({
      next: (data) => {
        this.planes = data;
        this.applyFilters(); // Aplicar filtros y ordenamiento iniciales
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar planes:', err);
        this.error = 'No se pudieron cargar los planes. Por favor, intente nuevamente.';
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
    let result = [...this.planes];

    // Aplicar búsqueda si hay término
    if (this.searchTerm && this.searchTerm.length >= 3) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(plan =>
        plan.nombre.toLowerCase().includes(term)
      );
    }

    // Aplicar ordenamiento si está configurado
    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredPlanes = result;
  }

  // Ordenar los datos según la columna seleccionada
  sortData(data: Plan[]): Plan[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      // Para ordenar por ID (numérico)
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      // Para texto (nombre)
      else if (column === 'nombre') {
        return a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase()) * factor;
      }
      // Para ordenar por montos (usando el monto máximo)
      else if (column === 'montoMaximo') {
        return (a.montoMaximo - b.montoMaximo) * factor;
      }
      // Para ordenar por tasa
      else if (column === 'tasa') {
        return (a.tasa - b.tasa) * factor;
      }
      // Para ordenar por cuotas (usando la cuota máxima)
      else if (column === 'cuotasAplicablesList') {
        const maxCuotaA = Math.max(...a.cuotasAplicablesList);
        const maxCuotaB = Math.max(...b.cuotasAplicablesList);
        return (maxCuotaA - maxCuotaB) * factor;
      }
      // Para ordenar por fecha
      else if (column === 'fechaInicio') {
        const dateA = new Date(a.fechaInicio).getTime();
        const dateB = new Date(b.fechaInicio).getTime();
        return (dateA - dateB) * factor;
      }
      // Para ordenar por estado (activo/inactivo)
      else if (column === 'activo') {
        return (a[column] === b[column] ? 0 : a[column] ? -1 : 1) * factor;
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

  // Navegar al detalle del plan
  verDetalle(id: number): void {
    this.planIdVer = id;
    this.modalVerOpen = true;
    this.manejarAperturaModal();
  }

  // Abrir modal para editar plan
  abrirModalEditarPlan(id: number): void {
    this.planIdEditar = id;
    this.modalEditarOpen = true;
    this.manejarAperturaModal();
  }

  // Cierra el modal de visualización
  cerrarModalVer() {
    this.modalVerOpen = false;
    this.planIdVer = null;
    this.manejarCierreModal();
  }

  // Cierra el modal de edición
  cerrarModalEditar() {
    this.modalEditarOpen = false;
    this.planIdEditar = null;
    this.manejarCierreModal();
  }

  // Maneja la solicitud de edición desde el modal de visualización
  onEditarSolicitado(id: number) {
    // Cerrar modal de visualización
    this.modalVerOpen = false;
    this.planIdVer = null;

    // Abrir modal de edición
    setTimeout(() => {
      this.abrirModalEditarPlan(id);
    }, 300); // Pequeño retraso para evitar superposición de modales
  }

  formatCuotas(cuotasAplicablesList: number[]): string {
    return cuotasAplicablesList.join(', ');
  }

  formatMonto(monto: number): string {
    return monto.toLocaleString('es-AR');
  }

  formatTasa(tasa: number): string {
    return tasa.toFixed(2) + '%';
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Abre el modal para nuevo plan
  abrirModalNuevoPlan() {
    this.modalOpen = true;
    this.manejarAperturaModal();
  }

  // Cierra el modal de creación
  cerrarModal() {
    this.modalOpen = false;
    this.manejarCierreModal();
  }

  // Maneja la creación de un plan
  onPlanCreado(plan: Plan) {
    this.loadPlanes(); // Recargar lista completa para asegurar datos actualizados
  }

  // Maneja la actualización de un plan
  onPlanActualizado(plan: Plan) {
    this.loadPlanes(); // Recargar lista completa para asegurar datos actualizados
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
