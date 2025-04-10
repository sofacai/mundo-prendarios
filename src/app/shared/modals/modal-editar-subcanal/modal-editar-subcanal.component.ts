import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SubcanalService, Subcanal, SubcanalCrearDto } from 'src/app/core/services/subcanal.service';
import { Gasto, GastoCreate, GastoUpdate } from 'src/app/core/models/gasto.model';

@Component({
  selector: 'app-modal-editar-subcanal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modal-editar-subcanal.component.html',
  styleUrls: ['./modal-editar-subcanal.component.scss']
})
export class ModalEditarSubcanalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() subcanalId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() subcanalActualizado = new EventEmitter<any>();

  subcanal: Subcanal | null = null;
  subcanalForm: FormGroup;
  loading = false;
  error: string | null = null;
  canales: any[] = []; // Almacena los canales disponibles
  admins: any[] = []; // Almacena los admins disponibles

  constructor(
    private fb: FormBuilder,
    private subcanalService: SubcanalService,
    private renderer: Renderer2
  ) {
    this.subcanalForm = this.createForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      canalId: [null, Validators.required],
      adminCanalId: [null, Validators.required],
      comision: [0, [Validators.required, Validators.min(0), Validators.max(100)]], // Agregado campo comision
      activo: [true],
      gastos: this.fb.array([])
    });
  }

  // Getter para acceder más fácilmente al FormArray de gastos
  get gastosFormArray(): FormArray {
    return this.subcanalForm.get('gastos') as FormArray;
  }

  // Crea un FormGroup para un nuevo gasto
  createGastoFormGroup(gasto?: Gasto): FormGroup {
    return this.fb.group({
      id: [gasto?.id || 0],
      nombre: [gasto?.nombre || '', Validators.required],
      porcentaje: [gasto?.porcentaje || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      subcanalId: [gasto?.subcanalId || this.subcanalId]
    });
  }

  // Añade un nuevo gasto al FormArray
  addGasto(gasto?: Gasto): void {
    const gastoForm = this.createGastoFormGroup(gasto);
    // Asegúrate de que el subcanalId esté establecido correctamente
    if (this.subcanalId) {
      gastoForm.get('subcanalId')?.setValue(this.subcanalId);
    }
    this.gastosFormArray.push(gastoForm);
  }

  // Elimina un gasto del FormArray
  removeGasto(index: number, gastoId?: number): void {
    // Si el gasto ya existe en la base de datos (tiene un ID), lo eliminamos
    if (gastoId && gastoId > 0) {
      this.loading = true;
      this.subcanalService.eliminarGasto(gastoId).subscribe({
        next: () => {
          this.gastosFormArray.removeAt(index);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al eliminar el gasto. Intente nuevamente.';
          console.error('Error eliminando gasto:', err);
          this.loading = false;
        }
      });
    } else {
      // Si es un gasto nuevo, simplemente lo eliminamos del formulario
      this.gastosFormArray.removeAt(index);
    }
  }

  // Calcula el porcentaje total de gastos
  getTotalPorcentaje(): number {
    return this.gastosFormArray.controls.reduce((total, control) => {
      return total + Number(control.get('porcentaje')?.value || 0);
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.handleModalOpen();
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && !changes['isOpen'].firstChange) {
      this.handleModalClose();
    }

    // Cargar datos del subcanal cuando cambia el ID y el modal está abierto
    if (changes['subcanalId'] && changes['subcanalId'].currentValue &&
        (!changes['isOpen'] || changes['isOpen']?.currentValue)) {
      this.cargarSubcanal(changes['subcanalId'].currentValue);
    }
  }

  handleModalOpen() {
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

  cargarSubcanal(id: number) {
    if (!id) return;

    this.loading = true;
    this.subcanalService.getSubcanal(id).subscribe({
      next: (subcanal) => {
        this.subcanal = subcanal;

        // Limpiar el FormArray de gastos
        while (this.gastosFormArray.length) {
          this.gastosFormArray.removeAt(0);
        }

        // Actualizar el formulario con los datos del subcanal
        this.subcanalForm.patchValue({
          nombre: subcanal.nombre,
          provincia: subcanal.provincia,
          localidad: subcanal.localidad,
          canalId: subcanal.canalId,
          adminCanalId: subcanal.adminCanalId,
          comision: subcanal.comision, // Agregado para cargar el valor de comisión
          activo: subcanal.activo
        });

        // Agregar los gastos al FormArray
        if (subcanal.gastos && subcanal.gastos.length > 0) {
          subcanal.gastos.forEach(gasto => {
            this.addGasto(gasto);
          });
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del subcanal.';
        console.error('Error cargando subcanal:', err);
        this.loading = false;
      }
    });
  }

  cerrarModal() {
    // Limpiar form y errores
    this.subcanalForm.reset();
    while (this.gastosFormArray.length) {
      this.gastosFormArray.removeAt(0);
    }
    this.error = null;
    this.subcanal = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  actualizarSubcanal() {
    if (this.subcanalForm.invalid || !this.subcanal) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.subcanalForm.controls).forEach(key => {
        const control = this.subcanalForm.get(key);
        if (key === 'gastos') {
          const gastosArray = control as FormArray;
          for (let i = 0; i < gastosArray.length; i++) {
            const gastoGroup = gastosArray.at(i);
            if (gastoGroup) {
              // Obtener las keys del FormGroup sin usar .controls
              Object.keys(gastoGroup.getRawValue()).forEach(fieldKey => {
                gastoGroup.get(fieldKey)?.markAsTouched();
              });
            }
          }
        } else {
          control?.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;

    // Obtenemos los valores del formulario para el subcanal
    const formValues = this.subcanalForm.value;

    // Crear el DTO para enviar al servidor
    const subcanalDto: SubcanalCrearDto = {
      nombre: formValues.nombre,
      provincia: formValues.provincia,
      localidad: formValues.localidad,
      canalId: formValues.canalId,
      adminCanalId: formValues.adminCanalId,
      comision: formValues.comision // Agregado el campo comision al DTO
    };

    // Guardar el ID del subcanal antes de la operación
    const subcanalIdActual = this.subcanal.id;

    // Actualizar primero el subcanal
    this.subcanalService.updateSubcanal(subcanalIdActual, subcanalDto).subscribe({
      next: (subcanal) => {
        // Usar el ID guardado, no el de la respuesta
        // Manejar los gastos después de que se actualice el subcanal
        this.procesarGastos(subcanalIdActual).then(() => {
          this.loading = false;
          this.subcanalActualizado.emit(subcanal);
          this.cerrarModal();
        }).catch(err => {
          this.loading = false;
          this.error = 'Error al actualizar los gastos. Intente nuevamente.';
          console.error('Error actualizando gastos:', err);
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al actualizar el subcanal. Intente nuevamente.';
        console.error('Error actualizando subcanal:', err);
      }
    });
  }

  // Procesar los gastos (añadir, actualizar, eliminar)
  async procesarGastos(subcanalId: number): Promise<void> {
    // Validación del ID
    if (!subcanalId || subcanalId <= 0) {
      console.error('Error: subcanalId es inválido:', subcanalId);
      throw new Error('ID de subcanal inválido');
    }


    const gastosForm = this.gastosFormArray.value;

    // Crea una promesa para cada gasto y las ejecuta en secuencia
    for (const gastoForm of gastosForm) {
      // Si el gasto no tiene ID o tiene ID=0, es un nuevo gasto
      if (!gastoForm.id || gastoForm.id === 0) {
        await new Promise<void>((resolve, reject) => {
          // Usar el endpoint POST /api/Subcanal/gasto
          const nuevoGasto: GastoCreate = {
            nombre: gastoForm.nombre,
            porcentaje: gastoForm.porcentaje,
            subcanalId: subcanalId // Usar el ID pasado como parámetro
          };


          this.subcanalService.agregarGasto(subcanalId, nuevoGasto).subscribe({
            next: (gastoCreado) => {
              resolve();
            },
            error: (err) => {
              console.error('Error en agregarGasto:', err);
              reject(err);
            }
          });
        });
      }
      // Si tiene ID, es un gasto existente que debe ser actualizado
      else {
        await new Promise<void>((resolve, reject) => {
          // Usar el endpoint PUT /api/Subcanal/gasto/{gastoId}
          const gastoActualizado: GastoUpdate = {
            nombre: gastoForm.nombre,
            porcentaje: gastoForm.porcentaje
          };

          this.subcanalService.updateGasto(gastoForm.id, gastoActualizado).subscribe({
            next: (gastoActualizado) => {
              resolve();
            },
            error: (err) => {
              console.error('Error en updateGasto:', err);
              reject(err);
            }
          });
        });
      }
    }
  }
}
