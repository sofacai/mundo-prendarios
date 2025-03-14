// Actualización para canal-form.component.ts

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CanalService, CanalCrearDto } from 'src/app/core/services/canal.service';

// Define la interfaz de tipos de canal con id y nombre
interface TipoCanal {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-canal-form',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './canal-form.component.html',
  styleUrls: ['./canal-form.component.scss']
})
export class CanalFormComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() canalCreado = new EventEmitter<any>();

  canalForm: FormGroup;
  loading = false;
  error: string | null = null;

  // Tipos de canal disponibles
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
    this.canalForm = this.fb.group({
      nombreFantasia: ['', Validators.required],
      razonSocial: ['', Validators.required],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      cuit: ['', Validators.required],
      cbu: ['', Validators.required],
      alias: [''],
      banco: ['', Validators.required],
      numCuenta: [''],
      tipoCanal: ['', Validators.required],
      activo: [true]
    });
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
        console.log('Modal abierto:', this.isOpen);
      } else if (!changes['isOpen'].firstChange) {
        // Remover clase y estilos cuando se cierra el modal
        this.renderer.removeClass(document.body, 'modal-open');
        this.renderer.removeStyle(document.body, 'padding-right');
        console.log('Modal cerrado');
      }
    }
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cerrarModal() {
    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    this.closeModal.emit(true);
  }

  resetForm() {
    this.canalForm.reset({
      activo: true,
      tipoCanal: ''
    });
    this.error = null;
  }

  guardarCanal() {
    if (this.canalForm.invalid) {
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

    // Crear el DTO con el nombre del tipo de canal (no el ID)
    const canalDto: CanalCrearDto = {
      ...formValues,
      tipoCanal: tipoSeleccionado ? tipoSeleccionado.nombre : '',
      // Añadir los arrays vacíos para subcanales y planesCanal
      subcanales: [],
      planesCanal: []
    };

    this.canalService.createCanal(canalDto).subscribe({
      next: (canal) => {
        this.loading = false;
        this.canalCreado.emit(canal);
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al crear el canal. Intente nuevamente.';
        console.error('Error creando canal:', err);
      }
    });
  }
}
