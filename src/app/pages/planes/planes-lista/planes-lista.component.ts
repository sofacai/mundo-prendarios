import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { PlanService, Plan } from 'src/app/core/services/plan.service';
import { PlanFormComponent } from 'src/app/shared/modals/plan-form/plan-form.component';
import { ModalEditarPlanComponent } from 'src/app/shared/modals/modal-editar-plan/modal-editar-plan.component';
import { ModalVerPlanComponent } from 'src/app/shared/modals/modal-ver-plan/modal-ver-plan.component';

@Component({
  selector: 'app-planes-lista',
  standalone: true,
  imports: [
    CommonModule,
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
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  planIdEditar: number | null = null;
  planIdVer: number | null = null;
  scrollbarWidth: number = 0;

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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar planes:', err);
        this.error = 'No se pudieron cargar los planes. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
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
