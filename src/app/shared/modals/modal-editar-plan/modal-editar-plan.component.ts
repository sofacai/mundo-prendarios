// Importar ToastService si decide usarlo para notificaciones
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PlanService, Plan, PlanCrearDto } from 'src/app/core/services/plan.service';

@Component({
  selector: 'app-modal-editar-plan',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modal-editar-plan.component.html',
  styleUrls: ['./modal-editar-plan.component.scss']
})
export class ModalEditarPlanComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() planId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() planActualizado = new EventEmitter<any>();

  plan: Plan | null = null;
  planForm: FormGroup;
  loading = false;
  statusUpdating = false; // Nuevo estado para actualización del estado
  error: string | null = null;
  cuotasDisponibles = [12, 24, 36, 48, 60];

  constructor(
    private fb: FormBuilder,
    private planService: PlanService,
    private renderer: Renderer2
  ) {
    this.planForm = this.createForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      montoMinimo: [0, [Validators.required, Validators.min(0)]],
      montoMaximo: [0, [Validators.required, Validators.min(0)]],
      cuotasAplicables: this.fb.array([], Validators.required),
      tasa: [0, [Validators.required, Validators.min(0)]],
      activo: [true]
    });
  }

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

        // Obtener las fechas en formato ISO para los inputs date
        const fechaInicio = new Date(plan.fechaInicio).toISOString().split('T')[0];
        const fechaFin = new Date(plan.fechaFin).toISOString().split('T')[0];

        // Limpiar y reconstruir el FormArray de cuotasAplicables
        this.cuotasControl.clear();

        // Asignar los valores al formulario
        this.planForm.patchValue({
          nombre: plan.nombre,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          montoMinimo: plan.montoMinimo,
          montoMaximo: plan.montoMaximo,
          tasa: plan.tasa,
          activo: plan.activo
        });

        // Marcar las cuotas aplicables
        if (plan.cuotasAplicablesList && plan.cuotasAplicablesList.length > 0) {
          this.actualizarCuotasSeleccionadas(plan.cuotasAplicablesList);
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del plan.';
        console.error('Error cargando plan:', err);
        this.loading = false;
      }
    });
  }

  get cuotasControl() {
    return this.planForm.get('cuotasAplicables') as FormArray;
  }

  actualizarCuotasSeleccionadas(cuotasSeleccionadas: number[]) {
    this.cuotasControl.clear();
    cuotasSeleccionadas.forEach(cuota => {
      this.cuotasControl.push(this.fb.control(cuota));
    });
  }

  toggleCuota(cuota: number) {
    const index = this.cuotasControl.controls.findIndex(control => control.value === cuota);

    if (index !== -1) {
      // Si ya está seleccionada, la removemos
      this.cuotasControl.removeAt(index);
    } else {
      // Si no está seleccionada, la agregamos
      this.cuotasControl.push(this.fb.control(cuota));
    }
  }

  isCuotaSelected(cuota: number): boolean {
    return this.cuotasControl.controls.some(control => control.value === cuota);
  }

  cerrarModal() {
    // Limpiar form y errores
    this.planForm.reset();
    this.cuotasControl.clear();
    this.error = null;
    this.plan = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  // Nuevo método para manejar el cambio de estado desde el toggle
  onToggleEstado(event: any) {
    if (!this.plan || this.statusUpdating) return;

    const nuevoEstado = event.detail.checked;

    // Verificar si el estado ha cambiado realmente
    if (nuevoEstado === this.plan.activo) return;

    this.statusUpdating = true;

    // Llamar al servicio correspondiente
    const accion = nuevoEstado
      ? this.planService.activarPlan(this.plan.id)
      : this.planService.desactivarPlan(this.plan.id);

    accion.subscribe({
      next: () => {
        // Actualizar el estado del plan y del formulario
        if (this.plan) {
          this.plan.activo = nuevoEstado;
        }
        this.planForm.get('activo')?.setValue(nuevoEstado, { emitEvent: false });
        this.statusUpdating = false;
      },
      error: (err) => {
        // Revertir el cambio en el formulario
        this.planForm.get('activo')?.setValue(!nuevoEstado, { emitEvent: false });
        this.error = `No se pudo ${nuevoEstado ? 'activar' : 'desactivar'} el plan. Intente nuevamente.`;
        console.error(`Error al ${nuevoEstado ? 'activar' : 'desactivar'} el plan:`, err);
        this.statusUpdating = false;
      }
    });
  }

  actualizarPlan() {
    if (this.planForm.invalid || !this.plan) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.planForm.controls).forEach(key => {
        const control = this.planForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    // Obtener los valores del formulario
    const formValues = this.planForm.value;

    // Crear el DTO para enviar al servidor
    const planDto: PlanCrearDto = {
      nombre: formValues.nombre,
      fechaInicio: formValues.fechaInicio,
      fechaFin: formValues.fechaFin,
      montoMinimo: formValues.montoMinimo,
      montoMaximo: formValues.montoMaximo,
      cuotasAplicables: formValues.cuotasAplicables,
      tasa: formValues.tasa,
      activo: formValues.activo
    };

    this.planService.updatePlan(this.plan.id, planDto).subscribe({
      next: (plan) => {
        this.loading = false;
        this.planActualizado.emit(plan);
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al actualizar el plan. Intente nuevamente.';
        console.error('Error actualizando plan:', err);
      }
    });
  }
}
