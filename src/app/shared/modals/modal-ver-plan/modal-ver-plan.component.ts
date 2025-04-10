import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PlanService, Plan } from 'src/app/core/services/plan.service';

@Component({
  selector: 'app-modal-ver-plan',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './modal-ver-plan.component.html',
  styleUrls: ['./modal-ver-plan.component.scss']
})
export class ModalVerPlanComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() planId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() editRequest = new EventEmitter<number>();

  plan: Plan | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private planService: PlanService,
    private renderer: Renderer2
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.handleModalOpen();
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && !changes['isOpen'].firstChange) {
      this.handleModalClose();
    }

    // Cargar datos del plan cuando cambia el ID
    if (changes['planId'] && changes['planId'].currentValue && this.isOpen) {
      this.cargarPlan(changes['planId'].currentValue);
    }
  }

  handleModalOpen() {
    // Si tenemos un ID de plan, cargamos sus datos
    if (this.planId) {
      this.cargarPlan(this.planId);
    }

    // Calculamos el ancho de la barra de desplazamiento
    const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

    // Añadir clase al body cuando se abre el modal
    this.renderer.addClass(document.body, 'modal-open');

    // Establece un padding-right al body para compensar la barra de desplazamiento
    this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
  }

  handleModalClose() {
    // Remover clase y estilos cuando se cierra el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarPlan(id: number) {
    this.loading = true;
    this.planService.getPlan(id).subscribe({
      next: (plan) => {
        this.plan = plan;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del plan.';
        console.error('Error cargando plan:', err);
        this.loading = false;
      }
    });
  }

  cerrarModal() {
    // Limpiar errores
    this.error = null;
    this.plan = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  editarPlan() {
    if (this.plan) {
      this.editRequest.emit(this.plan.id);
    }
  }

  // Formatos para mostrar datos
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
}
