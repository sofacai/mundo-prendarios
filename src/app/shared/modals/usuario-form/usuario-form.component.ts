import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UsuarioService, UsuarioCrearDto } from 'src/app/core/services/usuario.service';

// Define la interfaz de roles con id y nombre
interface Rol {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss']
})
export class UsuarioFormComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() usuarioCreado = new EventEmitter<any>();

  usuarioForm: FormGroup;
  loading = false;
  error: string | null = null;

  // Roles disponibles
  roles: Rol[] = [
    { id: 1, nombre: 'Admin' },
    { id: 2, nombre: 'AdminCanal' },
    { id: 3, nombre: 'Vendor' }
  ];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private renderer: Renderer2
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      password: ['', Validators.required],
      rolId: ['', Validators.required]
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
    this.usuarioForm.reset({
      rolId: ''
    });
    this.error = null;
  }

  guardarUsuario() {
    if (this.usuarioForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.usuarioForm.controls).forEach(key => {
        const control = this.usuarioForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    // Obtenemos los valores del formulario
    const formValues = this.usuarioForm.value;

    // Crear el DTO para enviar al servidor
    const usuarioDto: UsuarioCrearDto = {
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      email: formValues.email,
      telefono: formValues.telefono,
      password: formValues.password,
      rolId: parseInt(formValues.rolId, 10)
    };

    this.usuarioService.createUsuario(usuarioDto).subscribe({
      next: (usuario) => {
        this.loading = false;
        this.usuarioCreado.emit(usuario);
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al crear el usuario. Intente nuevamente.';
        console.error('Error creando usuario:', err);
      }
    });
  }
}
