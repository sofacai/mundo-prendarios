import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';

@Component({
  selector: 'app-modal-ver-usuario',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './modal-ver-usuario.component.html',
  styleUrls: ['./modal-ver-usuario.component.scss']
})
export class ModalVerUsuarioComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() usuarioId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() editRequest = new EventEmitter<number>();

  usuario: UsuarioDto | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.handleModalOpen();
      } else if (!changes['isOpen'].firstChange) {
        this.handleModalClose();
      }
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

  cargarUsuario(id: number) {
    this.loading = true;
    this.error = null;
    this.usuario = null;

    this.usuarioService.getUsuario(id).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
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
    this.error = null;
    this.usuario = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  editarUsuario() {
    if (this.usuario) {
      this.editRequest.emit(this.usuario.id);
      this.cerrarModal();
    }
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Devuelve la clase CSS según el rol
  getRolClass(rolId: number): string {
    switch (rolId) {
      case 1: // Admin
        return '';  // Sin clase específica para Admin
      case 2: // AdminCanal
        return 'badge-light-info';  // Color azul claro para AdminCanal
      case 3: // Vendor
        return 'badge-light-warning';  // Color amarillo claro para Vendor
      default:
        return '';
    }
  }
}
