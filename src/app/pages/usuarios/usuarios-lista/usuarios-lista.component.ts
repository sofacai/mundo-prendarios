import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { UsuarioFormComponent } from 'src/app/shared/modals/usuario-form/usuario-form.component';
import { ModalEditarUsuarioComponent } from 'src/app/shared/modals/modal-editar-usuario/modal-editar-usuario.component';
import { ModalVerUsuarioComponent } from 'src/app/shared/modals/modal-ver-usuario/modal-ver-usuario.component';

// Tipo para ordenamiento
interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  filteredUsuarios: UsuarioDto[] = []; // Lista filtrada para mostrar
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  usuarioIdEditar: number | null = null;
  usuarioIdVer: number | null = null;
  scrollbarWidth: number = 0;

  // Búsqueda y ordenamiento
  searchTerm: string = '';
  searchTimeout: any;
  sortState: SortState = { column: '', direction: 'asc' };

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
        this.applyFilters(); // Aplicar filtros y ordenamiento iniciales
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.error = 'No se pudieron cargar los usuarios. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  // Funciones para búsqueda
  onSearchChange() {
    // Debounce para evitar muchas búsquedas mientras el usuario escribe
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Aplicar filtros y ordenamiento a la lista
  applyFilters() {
    let result = [...this.usuarios];

    // Aplicar búsqueda si hay término
    if (this.searchTerm && this.searchTerm.length >= 3) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(usuario =>
        usuario.nombre.toLowerCase().includes(term) ||
        usuario.apellido.toLowerCase().includes(term) ||
        usuario.email.toLowerCase().includes(term)
      );
    }

    // Aplicar ordenamiento si está configurado
    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredUsuarios = result;
  }

  // Ordenar los datos según la columna seleccionada
  sortData(data: UsuarioDto[]): UsuarioDto[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      // Para ordenar por ID (numérico)
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      // Para ordenar por nombre (concatenando nombre y apellido)
      else if (column === 'nombre') {
        const nombreA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nombreB = `${b.nombre} ${b.apellido}`.toLowerCase();
        return nombreA.localeCompare(nombreB) * factor;
      }
      // Para ordenar por email
      else if (column === 'email') {
        return a.email.toLowerCase().localeCompare(b.email.toLowerCase()) * factor;
      }
      // Para ordenar por rol (usando rolId numérico)
      else if (column === 'rolId') {
        return (a.rolId - b.rolId) * factor;
      }
      // Para ordenar por estado (activo/inactivo)
      else if (column === 'activo') {
        return (a[column] === b[column] ? 0 : a[column] ? -1 : 1) * factor;
      }
      // Para ordenar por fechaAlta
      else if (column === 'fechaAlta') {
        // Manejar caso donde alguna fecha pueda ser null o undefined
        if (!a.fechaAlta) return factor; // Si a no tiene fecha, va al final
        if (!b.fechaAlta) return -factor; // Si b no tiene fecha, va al final
        return (new Date(a.fechaAlta).getTime() - new Date(b.fechaAlta).getTime()) * factor;
      }
      // Para ordenar por fechaUltimaOperacion
      else if (column === 'fechaUltimaOperacion') {
        // Manejar caso donde alguna fecha pueda ser null o undefined
        if (!a.fechaUltimaOperacion) return factor;
        if (!b.fechaUltimaOperacion) return -factor;
        return (new Date(a.fechaUltimaOperacion).getTime() - new Date(b.fechaUltimaOperacion).getTime()) * factor;
      }
      // Para ordenar por cantidadOperaciones
      else if (column === 'cantidadOperaciones') {
        return (a.cantidadOperaciones - b.cantidadOperaciones) * factor;
      }

      return 0;
    });
  }

  // Cambiar el ordenamiento cuando se hace clic en una columna
  sortBy(column: string) {
    // Si es la misma columna, cambiar dirección, si no, ordenar asc por la nueva columna
    if (this.sortState.column === column) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState = { column, direction: 'asc' };
    }

    this.applyFilters();
  }

  // Obtener el icono para la columna de ordenamiento
  getSortIcon(column: string): string {
    if (this.sortState.column !== column) {
      return 'bi-arrow-down-up text-muted';
    }

    return this.sortState.direction === 'asc'
      ? 'bi-sort-down-alt'
      : 'bi-sort-up-alt';
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
      case 4: // OficialComercial - Agregado nuevo rol
        return 'badge-light-primary';  // Color primario para OficialComercial
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
