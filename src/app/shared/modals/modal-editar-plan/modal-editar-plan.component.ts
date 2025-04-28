import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PlanService, Plan, PlanCrearDto, PlanTasa, PlanTasaCrearDto } from 'src/app/core/services/plan.service';

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
  statusUpdating = false;
  error: string | null = null;

  // Mapa de plazos para mostrar en la tabla
  plazosMap: { [key: number]: string } = {
    12: '12',
    18: '18',
    24: '24',
    30: '30',
    36: '36',
    48: '48',
    60: '60'
  };

  // Plazos disponibles para tasas
  plazosDisponibles = [12, 18, 24, 30, 36, 48, 60];

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
      activo: [true],
      tasas: this.fb.array([])
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

        // Asignar los valores básicos al formulario
        this.planForm.patchValue({
          nombre: plan.nombre,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          montoMinimo: plan.montoMinimo,
          montoMaximo: plan.montoMaximo,
          activo: plan.activo
        });

        // Inicializar las tasas
        this.initTasasForm();

        // Cargar las tasas si existen
        if (plan.tasas && plan.tasas.length > 0) {
          this.loadTasas(plan.tasas);
        } else {
          // Si no hay tasas, cargarlas desde el servicio
          this.loadTasasFromService();
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

  initTasasForm() {
    const tasasArray = this.planForm.get('tasas') as FormArray;

    // Limpiar el array primero
    while (tasasArray.length > 0) {
      tasasArray.removeAt(0);
    }

    // Crear un form group para cada plazo
    this.plazosDisponibles.forEach(plazo => {
      tasasArray.push(this.createTasaFormGroup(plazo));
    });
  }

  createTasaFormGroup(plazo: number): FormGroup {
    return this.fb.group({
      plazo: [plazo],
      tasaA: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      tasaB: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      tasaC: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      activo: [true] // Nuevo campo activo
    });
  }

  loadTasasFromService() {
    if (!this.planId) return;

    this.planService.getTasasByPlanId(this.planId).subscribe({
      next: (tasas) => {
        this.loadTasas(tasas);
      },
      error: (err) => {
        console.error('Error al cargar tasas:', err);
      }
    });
  }

  loadTasas(tasas: PlanTasa[]) {
    // Mapear las tasas recibidas a los FormGroup
    tasas.forEach(tasa => {
      const index = this.plazosDisponibles.indexOf(tasa.plazo);
      if (index !== -1) {
        const tasaGroup = this.tasasFormArray.at(index) as FormGroup;
        tasaGroup.patchValue({
          tasaA: tasa.tasaA,
          tasaB: tasa.tasaB,
          tasaC: tasa.tasaC,
          activo: tasa.activo // Cargar el estado activo
        });
      }
    });
  }

  get tasasFormArray(): FormArray {
    return this.planForm.get('tasas') as FormArray;
  }

  // Ayuda a TypeScript a entender que cada control es un FormGroup
  getFormGroup(index: number): FormGroup {
    return this.tasasFormArray.at(index) as FormGroup;
  }

  getTasasFromForm(): PlanTasaCrearDto[] {
    const tasas: PlanTasaCrearDto[] = [];

    this.tasasFormArray.controls.forEach((control: any) => {
      const tasa = control.value;
      tasas.push({
        plazo: tasa.plazo,
        tasaA: tasa.tasaA,
        tasaB: tasa.tasaB,
        tasaC: tasa.tasaC,
        activo: tasa.activo // Incluir estado activo
      });
    });

    return tasas;
  }

  // Método para manejar el cambio de estado desde el toggle principal del plan
  onToggleEstado(event: any) {
    if (!this.plan || this.statusUpdating) return;

    const nuevoEstado = event.target.checked;

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

  // Nuevo método para manejar toggle de estado de una tasa específica
  onToggleTasaEstado(event: any, tasaIndex: number) {
    const tasaGroup = this.getFormGroup(tasaIndex);
    const nuevoEstado = event.target.checked;

    // Si estamos modificando un plan existente y la tasa tiene ID, actualizarla en el servidor
    if (this.plan && this.plan.tasas && this.plan.tasas[tasaIndex] && this.plan.tasas[tasaIndex].id) {
      const tasaId = this.plan.tasas[tasaIndex].id;
      const accion = nuevoEstado
        ? this.planService.activarTasa(tasaId)
        : this.planService.desactivarTasa(tasaId);

      accion.subscribe({
        next: () => {
          if (this.plan && this.plan.tasas) {
            this.plan.tasas[tasaIndex].activo = nuevoEstado;
          }
          tasaGroup.get('activo')?.setValue(nuevoEstado, { emitEvent: false });
        },
        error: (err) => {
          tasaGroup.get('activo')?.setValue(!nuevoEstado, { emitEvent: false });
          this.error = `No se pudo ${nuevoEstado ? 'activar' : 'desactivar'} la tasa. Intente nuevamente.`;
          console.error(`Error al ${nuevoEstado ? 'activar' : 'desactivar'} la tasa:`, err);
        }
      });
    }
  }

  cerrarModal() {
    // Limpiar form y errores
    this.planForm.reset();
    this.initTasasForm();
    this.error = null;
    this.plan = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  actualizarPlan() {
    if (this.planForm.invalid || !this.plan) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.planForm.controls).forEach(key => {
        const control = this.planForm.get(key);
        if (control instanceof FormArray) {
          control.controls.forEach(c => {
            if (c instanceof FormGroup) {
              Object.keys(c.controls).forEach(k => {
                c.get(k)?.markAsTouched();
              });
            }
          });
        } else {
          control?.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;

    // Obtener los valores del formulario
    const formValues = this.planForm.value;

    // Obtener las tasas del formulario
    const tasas = this.getTasasFromForm();

    // Extraer plazos de las tasas para usarlos como cuotasAplicables
    const cuotasAplicables = tasas.map(t => t.plazo);

    // Preparar fechas en formato DD/MM/YYYY
    const fechaInicio = new Date(formValues.fechaInicio);
    const fechaFin = new Date(formValues.fechaFin);

    const fechaInicioStr = this.formatDate(fechaInicio);
    const fechaFinStr = this.formatDate(fechaFin);

    // Crear el DTO para enviar al servidor
    const planDto: PlanCrearDto = {
      nombre: formValues.nombre,
      fechaInicio: formValues.fechaInicio,
      fechaInicioStr: fechaInicioStr,
      fechaFin: formValues.fechaFin,
      fechaFinStr: fechaFinStr,
      montoMinimo: formValues.montoMinimo,
      montoMaximo: formValues.montoMaximo,
      cuotasAplicables: cuotasAplicables,
      tasa: 0, // Valor predeterminado ya que no se usa más
      gastoOtorgamiento: 0, // Valor predeterminado
      banco: '', // Valor predeterminado
      tasas: tasas
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

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
