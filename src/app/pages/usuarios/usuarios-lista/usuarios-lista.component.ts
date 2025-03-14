import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { UsuarioFormComponent } from 'src/app/shared/modals/usuario-form/usuario-form.component';
import { ModalEditarUsuarioComponent } from 'src/app/shared/modals/modal-editar-usuario/modal-editar-usuario.component';
import { ModalVerUsuarioComponent } from 'src/app/shared/modals/modal-ver-usuario/modal-ver-usuario.component';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    IonicModule,
    UsuarioFormComponent,
    ModalEditarUsuarioComponent,
    ModalVerUsuarioComponent
  ],
  templateUrl: './usuarios-lista.component.html',
  styleUrls: ['./usuarios-lista.component.scss']
})
export class UsuariosListaComponent implements OnInit {
  usuarios: UsuarioDto[] = [];
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  usuarioIdEditar: number | null = null;
  usuarioIdVer: number | null = null;
  scrollbarWidth: number = 0;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.loadUsuarios();
    // Calcular el ancho de la barra de desplazamiento
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  }

  loadUsuarios() {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.error = 'No se pudieron cargar los usuarios. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  // Navegar al detalle del usuario
  verDetalle(id: number): void {
    this.usuarioIdVer = id;
    this.modalVerOpen = true;
    this.manejarAperturaModal();
  }

  // Abrir modal para editar usuario
  abrirModalEditarUsuario(id: number): void {
    this.usuarioIdEditar = id;
    this.modalEditarOpen = true;
    this.manejarAperturaModal();
  }

  // Cierra el modal de visualización
  cerrarModalVer() {
    this.modalVerOpen = false;
    this.usuarioIdVer = null;
    this.manejarCierreModal();
  }

  // Cierra el modal de edición
  cerrarModalEditar() {
    this.modalEditarOpen = false;
    this.usuarioIdEditar = null;
    this.manejarCierreModal();
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

  // Abre el modal para nuevo usuario
  abrirModalNuevoUsuario() {
    this.modalOpen = true;
    this.manejarAperturaModal();
  }

  // Cierra el modal de creación
  cerrarModal() {
    this.modalOpen = false;
    this.manejarCierreModal();
  }

  // Maneja la solicitud de edición desde el modal de visualización
  onEditarSolicitado(id: number) {
    // Cerrar modal de visualización
    this.modalVerOpen = false;
    this.usuarioIdVer = null;

    // Abrir modal de edición
    setTimeout(() => {
      this.abrirModalEditarUsuario(id);
    }, 300); // Pequeño retraso para evitar superposición de modales
  }

  // Maneja la creación o edición de un usuario
  onUsuarioCreado(usuario: UsuarioDto) {
    this.loadUsuarios(); // Recargar la lista completa para asegurar datos actualizados
  }

  onUsuarioActualizado(usuario: UsuarioDto) {
    this.loadUsuarios(); // Recargar la lista completa para asegurar datos actualizados
  }

  // Funciones helper para manejar estilos del body
  private manejarAperturaModal() {
    // Añadir clase al cuerpo para mantener la barra de desplazamiento
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      this.renderer.addClass(contentArea, 'content-area-with-modal');
      // Fijar la posición del body para evitar desplazamiento
      this.renderer.setStyle(document.body, 'position', 'fixed');
      this.renderer.setStyle(document.body, 'width', '100%');
      this.renderer.setStyle(document.body, 'overflow-y', 'scroll');
    }
  }

  private manejarCierreModal() {
    // Solo restaurar si no hay ningún otro modal abierto
    if (!this.modalOpen && !this.modalEditarOpen && !this.modalVerOpen) {
      const contentArea = document.querySelector('.content-area') as HTMLElement;
      if (contentArea) {
        this.renderer.removeClass(contentArea, 'content-area-with-modal');
        this.renderer.removeStyle(document.body, 'position');
        this.renderer.removeStyle(document.body, 'width');
        this.renderer.removeStyle(document.body, 'overflow-y');
      }
    }
  }
}
