import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UsuarioService, UsuarioDto, UsuarioCrearDto } from 'src/app/core/services/usuario.service';

// Interfaz para los roles
interface Rol {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-modal-editar-usuario',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modal-editar-usuario.component.html',
  styleUrls: ['./modal-editar-usuario.component.scss']
})
export class ModalEditarUsuarioComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() usuarioId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() usuarioActualizado = new EventEmitter<any>();

  usuario: UsuarioDto | null = null;
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
    this.usuarioForm = this.createForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      password: [''], // Opcional para edición
      rolId: ['', Validators.required],
      creadorId: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.handleModalOpen();
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && !changes['isOpen'].firstChange) {
      this.handleModalClose();
    }

    // Cargar datos del usuario cuando cambia el ID
    if (changes['usuarioId'] && changes['usuarioId'].currentValue && this.isOpen) {
      this.cargarUsuario(changes['usuarioId'].currentValue);
    }
  }

  handleModalOpen() {
    // Si tenemos un ID de usuario, cargamos sus datos
    if (this.usuarioId) {
      this.cargarUsuario(this.usuarioId);
    }

    // Calculamos el ancho de la barra de desplazamiento
    const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

    // Añadir clase al body cuando se abre el modal
    this.renderer.addClass(document.body, 'modal-open');

    // Establece un padding-right al body para compensar la barra de desplazamiento
    this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
    console.log('Modal de edición abierto');
  }

  handleModalClose() {
    // Remover clase y estilos cuando se cierra el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    console.log('Modal de edición cerrado');
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarUsuario(id: number) {
    this.loading = true;
    this.usuarioService.getUsuario(id).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.usuarioForm.patchValue({
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          telefono: usuario.telefono,
          rolId: usuario.rolId.toString(),
          password: '' // Dejamos vacío el campo de contraseña
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del usuario.';
        console.error('Error cargando usuario:', err);
        this.loading = false;
      }
    });
  }

  cerrarModal() {
    // Limpiar form y errores
    this.usuarioForm.reset();
    this.error = null;
    this.usuario = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  actualizarUsuario() {
    if (this.usuarioForm.invalid || !this.usuario) {
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
      password: formValues.password || undefined, // Solo enviar si hay un nuevo valor
      rolId: parseInt(formValues.rolId, 10),
      creadorId: formValues.creadorId

    };

    // Si la contraseña está vacía, la eliminamos del objeto para no enviarla
    if (!usuarioDto.password) {
      usuarioDto.password = '' as any; // O usar null si la API lo acepta
    }

    this.usuarioService.updateUsuario(this.usuario.id, usuarioDto).subscribe({
      next: (usuario) => {
        this.loading = false;
        this.usuarioActualizado.emit(usuario);
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al actualizar el usuario. Intente nuevamente.';
        console.error('Error actualizando usuario:', err);
      }
    });
  }
}
