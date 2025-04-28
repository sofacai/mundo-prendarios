import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PlanService, Plan, PlanCrearDto, PlanTasa, PlanTasaCrearDto } from 'src/app/core/services/plan.service';

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
          this.initTasasForm(); // Inicializar la tabla de tasas con valores predeterminados
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
      tasas: this.fb.array([])
    });

    // Inicializar las tasas para cada plazo
    this.initTasasForm();
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
      activo: [true] // Nuevo campo para activar/desactivar plazos
    });
  }

  get tasasFormArray(): FormArray {
    return this.planForm.get('tasas') as FormArray;
  }

  // Ayuda a TypeScript a entender que cada control es un FormGroup
  getFormGroup(index: number): FormGroup {
    return this.tasasFormArray.at(index) as FormGroup;
  }

  resetForm() {
    this.planForm.reset({
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      montoMinimo: '',
      montoMaximo: ''
    });

    // Resetear tasas
    this.initTasasForm();

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
          montoMaximo: plan.montoMaximo
        });

        // Cargar las tasas si existen
        if (plan.tasas && plan.tasas.length > 0) {
          this.loadTasas(plan.tasas);
        } else {
          // Si no hay tasas, cargarlas desde el servicio
          this.loadTasasFromService();
        }
      },
      error: (err) => {
        console.error('Error al cargar plan:', err);
        this.error = 'No se pudo cargar la información del plan.';
      }
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
    // Reset el formArray de tasas
    this.initTasasForm();

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

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD para input type="date"
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

  // Método para manejar toggle de estado de una tasa específica
  onToggleTasaEstado(event: any, tasaIndex: number) {
    const tasaGroup = this.getFormGroup(tasaIndex);
    const nuevoEstado = event.target.checked;
    tasaGroup.get('activo')?.setValue(nuevoEstado, { emitEvent: false });

    // Si estamos en modo edición y hay un planId, actualizar la tasa en el servidor
    if (this.isEditing && this.planId) {
      // Este código sería similar al de modal-editar-plan, pero aquí no tenemos acceso directo al array de tasas del plan
      // Se actualizará cuando se guarde todo el plan
    }
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
        activo: tasa.activo // Incluir el estado activo
      });
    });

    return tasas;
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
    this.error = null;

    // Preparar fechas en formato DD/MM/YYYY para el backend
    const fechaInicio = new Date(this.planForm.value.fechaInicio);
    const fechaFin = new Date(this.planForm.value.fechaFin);

    const fechaInicioStr = this.formatDate(fechaInicio);
    const fechaFinStr = this.formatDate(fechaFin);

    // Obtener las tasas del formulario
    const tasas = this.getTasasFromForm();

    // Extraer plazos de las tasas para usarlos como cuotasAplicables
    const cuotasAplicables = tasas.map(t => t.plazo);

    // Crear el objeto PlanCrearDto
    const planDto: PlanCrearDto = {
      nombre: this.planForm.value.nombre,
      fechaInicio: this.planForm.value.fechaInicio,
      fechaInicioStr: fechaInicioStr,
      fechaFin: this.planForm.value.fechaFin,
      fechaFinStr: fechaFinStr,
      montoMinimo: this.planForm.value.montoMinimo,
      montoMaximo: this.planForm.value.montoMaximo,
      cuotasAplicables: cuotasAplicables,
      tasa: 0, // Valor predeterminado ya que no se usa
      gastoOtorgamiento: 0, // Valor predeterminado
      banco: '', // Valor predeterminado
      tasas: tasas
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
