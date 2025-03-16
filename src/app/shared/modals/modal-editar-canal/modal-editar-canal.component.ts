import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CanalService, Canal, CanalCrearDto } from 'src/app/core/services/canal.service';

// Define la interfaz de tipos de canal con id y nombre
interface TipoCanal {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-modal-editar-canal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modal-editar-canal.component.html',
  styleUrls: ['./modal-editar-canal.component.scss']
})
export class ModalEditarCanalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() canalId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() canalActualizado = new EventEmitter<any>();

  canal: Canal | null = null;
  canalForm: FormGroup;
  loading = false;
  error: string | null = null;

  // Tipos de canal disponibles actualizados
  tiposCanal: TipoCanal[] = [
    { id: 1, nombre: 'Concesionario' },
    { id: 2, nombre: 'Multimarca' },
    { id: 3, nombre: 'Agencia' },
    { id: 4, nombre: 'Habitualista' },
    { id: 5, nombre: 'Freelance' },
    { id: 6, nombre: 'Consumidor Final' }
  ];

  constructor(
    private fb: FormBuilder,
    private canalService: CanalService,
    private renderer: Renderer2
  ) {
    this.canalForm = this.createForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombreFantasia: ['', Validators.required],
      razonSocial: ['', Validators.required],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      cuit: ['', Validators.required],
      cbu: ['', Validators.required],
      alias: ['', Validators.required],
      banco: ['', Validators.required],
      numCuenta: ['', Validators.required],
      tipoCanal: ['', Validators.required],
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

    // Cargar datos del canal cuando cambia el ID
    if (changes['canalId'] && changes['canalId'].currentValue && this.isOpen) {
      this.cargarCanal(changes['canalId'].currentValue);
    }
  }

  handleModalOpen() {
    // Si tenemos un ID de canal, cargamos sus datos
    if (this.canalId) {
      this.cargarCanal(this.canalId);
    }

    // Calculamos el ancho de la barra de desplazamiento
    const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

    // Añadir clase al body cuando se abre el modal
    this.renderer.addClass(document.body, 'modal-open');

    // Establece un padding-right al body para compensar la barra de desplazamiento
    this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
    console.log('Modal de edición del canal abierto');
  }

  handleModalClose() {
    // Remover clase y estilos cuando se cierra el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    console.log('Modal de edición del canal cerrado');
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarCanal(id: number) {
    this.loading = true;
    this.canalService.getCanal(id).subscribe({
      next: (canal) => {
        this.canal = canal;

        // Encuentra el id del tipo de canal basado en el nombre
        const tipoId = this.obtenerTipoCanalId(canal.tipoCanal);

        this.canalForm.patchValue({
          nombreFantasia: canal.nombreFantasia,
          razonSocial: canal.razonSocial,
          provincia: canal.provincia,
          localidad: canal.localidad,
          cuit: canal.cuit,
          cbu: canal.cbu,
          alias: canal.alias,
          banco: canal.banco,
          numCuenta: canal.numCuenta,
          tipoCanal: tipoId.toString(), // Usamos el ID como string para el select
          activo: canal.activo
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del canal.';
        console.error('Error cargando canal:', err);
        this.loading = false;
      }
    });
  }

  // Método para obtener el ID del tipo de canal basado en su nombre
  obtenerTipoCanalId(nombreTipoCanal: string): number {
    const tipo = this.tiposCanal.find(t => t.nombre === nombreTipoCanal);
    return tipo ? tipo.id : 1; // Por defecto retorna 1 si no encuentra coincidencia
  }

  cerrarModal() {
    // Limpiar form y errores
    this.canalForm.reset();
    this.error = null;
    this.canal = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  actualizarCanal() {
    if (this.canalForm.invalid || !this.canal) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.canalForm.controls).forEach(key => {
        const control = this.canalForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    // Obtenemos los valores del formulario
    const formValues = this.canalForm.value;

    // Encontrar el nombre del tipo de canal seleccionado
    const tipoSeleccionado = this.tiposCanal.find(tipo => tipo.id.toString() === formValues.tipoCanal);

    // Crear el DTO para enviar al servidor
    const canalDto: CanalCrearDto = {
      nombreFantasia: formValues.nombreFantasia,
      razonSocial: formValues.razonSocial,
      provincia: formValues.provincia,
      localidad: formValues.localidad,
      cuit: formValues.cuit,
      cbu: formValues.cbu,
      alias: formValues.alias,
      banco: formValues.banco,
      numCuenta: formValues.numCuenta,
      tipoCanal: tipoSeleccionado ? tipoSeleccionado.nombre : '',
      activo: formValues.activo
    };

    this.canalService.updateCanal(this.canal.id, canalDto).subscribe({
      next: (canal) => {
        this.loading = false;
        this.canalActualizado.emit(canal);
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al actualizar el canal. Intente nuevamente.';
        console.error('Error actualizando canal:', err);
      }
    });
  }
}
