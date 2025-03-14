import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PlanService, Plan, PlanCrearDto } from 'src/app/core/services/plan.service';

@Component({
  selector: 'app-plan-form',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './plan-form.component.html',
  styleUrls: ['./plan-form.component.scss']
})
export class PlanFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() planId?: number;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() planCreado = new EventEmitter<Plan>();
  @Output() planActualizado = new EventEmitter<Plan>();

  planForm!: FormGroup;
  loading = false;
  error: string | null = null;
  title = 'Nuevo Plan';
  isEditing = false;

  // Opciones de cuotas disponibles
  cuotasDisponibles = [
    { valor: 12, seleccionado: false },
    { valor: 24, seleccionado: false },
    { valor: 36, seleccionado: false },
    { valor: 48, seleccionado: false },
    { valor: 60, seleccionado: false }
  ];

  constructor(
    private fb: FormBuilder,
    private planService: PlanService,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.resetForm();
        // Calculamos el ancho de la barra de desplazamiento
        const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

        // Añadir clase al body cuando se abre el modal
        this.renderer.addClass(document.body, 'modal-open');

        // Establece un padding-right al body para compensar la barra de desplazamiento
        this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);

        // Si hay un ID, estamos editando
        if (this.planId) {
          this.isEditing = true;
          this.title = 'Editar Plan';
          this.loadPlan();
        } else {
          this.isEditing = false;
          this.title = 'Nuevo Plan';
        }
      } else if (!changes['isOpen'].firstChange) {
        // Remover clase y estilos cuando se cierra el modal
        this.renderer.removeClass(document.body, 'modal-open');
        this.renderer.removeStyle(document.body, 'padding-right');
      }
    }
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  initForm() {
    this.planForm = this.fb.group({
      nombre: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      montoMinimo: ['', [Validators.required, Validators.min(0)]],
      montoMaximo: ['', [Validators.required, Validators.min(0)]],
      tasa: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      montoFijo: ['', [Validators.required, Validators.min(0)]]
    });
  }

  resetForm() {
    this.planForm.reset({
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      montoMinimo: '',
      montoMaximo: '',
      tasa: '',
      montoFijo: 0
    });

    // Resetear selección de cuotas
    this.cuotasDisponibles.forEach(cuota => cuota.seleccionado = false);

    this.error = null;
  }

  loadPlan() {
    if (!this.planId) return;

    this.planService.getPlan(this.planId).subscribe({
      next: (plan) => {
        this.planForm.patchValue({
          nombre: plan.nombre,
          fechaInicio: this.formatDateForInput(plan.fechaInicio),
          fechaFin: this.formatDateForInput(plan.fechaFin),
          montoMinimo: plan.montoMinimo,
          montoMaximo: plan.montoMaximo,
          tasa: plan.tasa,
          montoFijo: plan.montoFijo
        });

        // Marcar las cuotas que ya están seleccionadas
        this.cuotasDisponibles.forEach(cuota => {
          cuota.seleccionado = plan.cuotasAplicablesList.includes(cuota.valor);
        });
      },
      error: (err) => {
        console.error('Error al cargar plan:', err);
        this.error = 'No se pudo cargar la información del plan.';
      }
    });
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD para input type="date"
  }

  toggleCuota(cuota: any) {
    cuota.seleccionado = !cuota.seleccionado;
  }

  formatMonto(event: any, field: string) {
    let value = event.target.value.replace(/\D/g, ''); // Eliminar todo lo que no sean dígitos

    if (value) {
      // Convertir a número para quitar ceros a la izquierda
      const numberValue = parseInt(value, 10);

      // Formatear con puntos como separadores de miles
      value = numberValue.toLocaleString('es-AR').replace(/,/g, '');

      // Actualizar el valor del campo en el formulario sin los separadores
      this.planForm.get(field)?.setValue(numberValue, { emitEvent: false });

      // Actualizar el valor mostrado en el input con separadores
      event.target.value = value;
    } else {
      this.planForm.get(field)?.setValue('', { emitEvent: false });
    }
  }

  getCuotasSeleccionadas(): number[] {
    return this.cuotasDisponibles
      .filter(cuota => cuota.seleccionado)
      .map(cuota => cuota.valor);
  }

  cerrarModal() {
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    this.closeModal.emit(true);
  }

  guardarPlan() {
    if (this.planForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.planForm.controls).forEach(key => {
        const control = this.planForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    // Verificar que al menos una cuota esté seleccionada
    const cuotasSeleccionadas = this.getCuotasSeleccionadas();
    if (cuotasSeleccionadas.length === 0) {
      this.error = 'Debe seleccionar al menos una opción de cuotas.';
      return;
    }

    this.loading = true;
    this.error = null;

    // Preparar fechas en formato DD/MM/YYYY
    const fechaInicio = new Date(this.planForm.value.fechaInicio);
    const fechaFin = new Date(this.planForm.value.fechaFin);

    const fechaInicioStr = this.formatDate(fechaInicio);
    const fechaFinStr = this.formatDate(fechaFin);

    // Crear el objeto PlanCrearDto
    const planDto: PlanCrearDto = {
      nombre: this.planForm.value.nombre,
      fechaInicio: this.planForm.value.fechaInicio,
      fechaFin: this.planForm.value.fechaFin,
      montoMinimo: this.planForm.value.montoMinimo,
      montoMaximo: this.planForm.value.montoMaximo,
      cuotasAplicables: cuotasSeleccionadas,
      tasa: this.planForm.value.tasa,
      montoFijo: this.planForm.value.montoFijo,
      activo: true
    };

    if (this.isEditing && this.planId) {
      // Actualizar plan existente
      this.planService.updatePlan(this.planId, planDto).subscribe({
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
    } else {
      // Crear nuevo plan
      this.planService.createPlan(planDto).subscribe({
        next: (plan) => {
          this.loading = false;
          this.planCreado.emit(plan);
          this.cerrarModal();
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al crear el plan. Intente nuevamente.';
          console.error('Error creando plan:', err);
        }
      });
    }
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
