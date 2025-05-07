import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { UsuarioFormComponent } from 'src/app/shared/modals/usuario-form/usuario-form.component';
import { ModalEditarUsuarioComponent } from 'src/app/shared/modals/modal-editar-usuario/modal-editar-usuario.component';
import { ModalVerUsuarioComponent } from 'src/app/shared/modals/modal-ver-usuario/modal-ver-usuario.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { Operacion } from 'src/app/core/services/operacion.service';
import { OperacionService } from '../../../core/services/operacion.service';

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
    RouterModule,
    ModalVerUsuarioComponent
  ],
  templateUrl: './usuarios-lista.component.html',
  styleUrls: ['./usuarios-lista.component.scss']
})
export class UsuariosListaComponent implements OnInit, OnDestroy {
  usuarios: UsuarioDto[] = [];
  filteredUsuarios: UsuarioDto[] = [];
  paginatedUsuarios: UsuarioDto[] = [];
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  usuarioIdEditar: number | null = null;
  usuarioIdVer: number | null = null;
  loadingUsuarios: Map<number, boolean> = new Map();
  operaciones: Operacion[] = [];


  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;
  sidebarLayoutLocked = false;

  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalUsuarios: number = 0;
  totalPaginas: number = 1;

  searchTerm: string = '';
  searchTimeout: any;
  filterActive: string = 'all';
  sortState: SortState = { column: 'id', direction: 'asc' };

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private renderer: Renderer2,
    private sidebarStateService: SidebarStateService,
    private OperacionService: OperacionService
  ) { }

  ngOnInit() {
    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarLayoutLocked = true;
    this.adjustContentArea();

    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        if (!this.sidebarLayoutLocked) {
          this.isSidebarCollapsed = collapsed;
          this.adjustContentArea();
        }
      }
    );

    this.loadUsuarios();
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  private adjustContentArea() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      if (this.isSidebarCollapsed) {
        contentArea.style.marginLeft = '70px';
      } else {
        contentArea.style.marginLeft = '260px';
      }
    }
  }

  loadUsuarios() {
    this.loading = true;
    this.error = null;
    this.sidebarLayoutLocked = true;

    // Cargar usuarios y operaciones en paralelo
    forkJoin({
      usuarios: this.usuarioService.getUsuarios(),
      operaciones: this.OperacionService.getOperaciones()
    }).subscribe({
      next: (data) => {
        this.usuarios = data.usuarios;
        this.operaciones = data.operaciones;
        this.applyFilters();
        this.loading = false;
        this.sidebarLayoutLocked = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los usuarios. Por favor, intente nuevamente.';
        this.loading = false;
        this.sidebarLayoutLocked = false;
      }
    });
  }

  getOperacionesLiquidadas(usuarioId: number): number {
    const operacionesUser = this.operaciones.filter(op => op.vendedorId === usuarioId);
    return operacionesUser.filter(op => op.estado?.toLowerCase() === 'liquidada').length;
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.paginaActual = 1;
      this.applyFilters();
    }, 300);
  }

  clearSearch() {
    this.searchTerm = '';
    this.paginaActual = 1;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.usuarios];

    if (this.searchTerm && this.searchTerm.length >= 1) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(usuario =>
        `${usuario.nombre || ''} ${usuario.apellido || ''}`.toLowerCase().includes(term) ||
        (usuario.nombre && usuario.nombre.toLowerCase().includes(term)) ||
        (usuario.apellido && usuario.apellido.toLowerCase().includes(term)) ||
        (usuario.email && usuario.email.toLowerCase().includes(term))
      );
    }

    if (this.filterActive === 'active') {
      result = result.filter(usuario => usuario.activo);
    } else if (this.filterActive === 'inactive') {
      result = result.filter(usuario => !usuario.activo);
    }

    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredUsuarios = result;
    this.totalUsuarios = this.filteredUsuarios.length;
    this.calcularTotalPaginas();
    this.paginarUsuarios();
  }

  sortData(data: UsuarioDto[]): UsuarioDto[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      else if (column === 'nombre') {
        const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
        const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase();
        return nombreA.localeCompare(nombreB) * factor;
      }
      else if (column === 'email') {
        return (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase()) * factor;
      }
      else if (column === 'rolId') {
        return (a.rolId - b.rolId) * factor;
      }
      else if (column === 'activo') {
        return (a[column] === b[column] ? 0 : a[column] ? -1 : 1) * factor;
      }
      else if (column === 'cantidadOperaciones') {
        // Ordenar por operaciones liquidadas en lugar de cantidadOperaciones
        const opLiqA = this.getOperacionesLiquidadas(a.id);
        const opLiqB = this.getOperacionesLiquidadas(b.id);
        return (opLiqA - opLiqB) * factor;
      }

      return 0;
    });
  }

  sortBy(column: string) {
    if (this.sortState.column === column) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState = { column, direction: 'asc' };
    }

    this.paginaActual = 1;
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortState.column !== column) {
      return 'bi-arrow-down-up text-muted';
    }

    return this.sortState.direction === 'asc'
      ? 'bi-sort-down-alt'
      : 'bi-sort-up-alt';
  }

  verDetalle(id: number): void {
    this.usuarioIdVer = id;
    this.modalVerOpen = true;
    this.manejarAperturaModal();
  }

  toggleUsuarioEstado(usuario: UsuarioDto): void {
    this.loadingUsuarios.set(usuario.id, true);

    const request = usuario.activo
      ? this.usuarioService.desactivarUsuario(usuario.id)
      : this.usuarioService.activarUsuario(usuario.id);

    request.subscribe({
      next: () => {
        this.usuarios = this.usuarios.map(u => {
          if (u.id === usuario.id) {
            return {...u, activo: !usuario.activo};
          }
          return u;
        });

        this.filteredUsuarios = this.filteredUsuarios.map(u => {
          if (u.id === usuario.id) {
            return {...u, activo: !usuario.activo};
          }
          return u;
        });

        this.paginarUsuarios();
        this.loadingUsuarios.set(usuario.id, false);
      },
      error: () => {
        this.loadingUsuarios.set(usuario.id, false);
      }
    });
  }

  isUsuarioLoading(usuarioId: number): boolean {
    return this.loadingUsuarios.get(usuarioId) === true;
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  getRolClass(rolId: number): string {
    switch (rolId) {
      case 1:
        return '';
      case 2:
        return 'badge-light-info';
      case 3:
        return 'badge-light-warning';
      case 4:
        return 'badge-light-primary';
      default:
        return '';
    }
  }

  calcularTotalPaginas() {
    this.totalPaginas = Math.ceil(this.filteredUsuarios.length / this.itemsPorPagina);

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
  }

  paginarUsuarios() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = Math.min(inicio + this.itemsPorPagina, this.filteredUsuarios.length);

    this.paginatedUsuarios = this.filteredUsuarios.slice(inicio, fin);
  }

  cambiarPagina(pagina: any) {
    const paginaNum = Number(pagina);

    if (isNaN(paginaNum) || paginaNum < 1 || paginaNum > this.totalPaginas) {
      return;
    }

    this.paginaActual = paginaNum;
    this.paginarUsuarios();
  }

  obtenerPaginas(): (number | string)[] {
    const paginasMostradas = 5;
    let paginas: (number | string)[] = [];

    if (this.totalPaginas <= paginasMostradas) {
      for (let i = 1; i <= this.totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);

      let inicio = Math.max(2, this.paginaActual - 1);
      let fin = Math.min(this.totalPaginas - 1, this.paginaActual + 1);

      if (inicio === 2) fin = Math.min(4, this.totalPaginas - 1);
      if (fin === this.totalPaginas - 1) inicio = Math.max(2, this.totalPaginas - 3);

      if (inicio > 2) paginas.push('...');

      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }

      if (fin < this.totalPaginas - 1) paginas.push('...');

      paginas.push(this.totalPaginas);
    }

    return paginas;
  }

  abrirModalNuevoUsuario() {
    this.modalOpen = true;
    this.manejarAperturaModal();
  }

  cerrarModal() {
    this.modalOpen = false;
    this.manejarCierreModal();
  }

  abrirModalEditarUsuario(id: number): void {
    this.usuarioIdEditar = id;
    this.modalEditarOpen = true;
    this.manejarAperturaModal();
  }

  cerrarModalVer() {
    this.modalVerOpen = false;
    this.usuarioIdVer = null;
    this.manejarCierreModal();
  }

  cerrarModalEditar() {
    this.modalEditarOpen = false;
    this.usuarioIdEditar = null;
    this.manejarCierreModal();
  }

  onEditarSolicitado(id: number) {
    this.modalVerOpen = false;
    this.usuarioIdVer = null;

    setTimeout(() => {
      this.abrirModalEditarUsuario(id);
    }, 300);
  }

  onUsuarioCreado(usuario: UsuarioDto) {
    this.loadUsuarios();
  }

  onUsuarioActualizado(usuario: UsuarioDto) {
    this.loadUsuarios();
  }

  private manejarAperturaModal() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      this.renderer.addClass(contentArea, 'content-area-with-modal');
    }

    // Solo desactiva scroll del body, sin fijarlo
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  private manejarCierreModal() {
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
