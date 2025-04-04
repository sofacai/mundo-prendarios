import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { CanalFormComponent } from 'src/app/shared/modals/canal-form/canal-form.component';
import { ModalEditarCanalComponent } from 'src/app/shared/modals/modal-editar-canal/modal-editar-canal.component';
import { ModalVerCanalComponent } from 'src/app/shared/modals/modal-ver-canal/modal-ver-canal.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { Router } from '@angular/router';

interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-canales-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    IonicModule,
    CanalFormComponent,
    ModalEditarCanalComponent,
    ModalVerCanalComponent
  ],
  templateUrl: './canales-lista.component.html',
  styleUrls: ['./canales-lista.component.scss']
})
export class CanalesListaComponent implements OnInit, OnDestroy {
  canales: Canal[] = [];
  filteredCanales: Canal[] = [];
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  canalIdEditar: number | null = null;
  canalIdVer: number | null = null;

  loadingCanales: Map<number, boolean> = new Map();

  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  searchTerm: string = '';
  searchTimeout: any;
  filterActive: string = 'all';
  sortState: SortState = { column: 'id', direction: 'asc' };

  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalCanales: number = 0;
  totalPaginas: number = 1;

  paginatedCanales: Canal[] = [];

  constructor(
    private canalService: CanalService,
    private renderer: Renderer2,
    private sidebarStateService: SidebarStateService,
    private router: Router
  ) { }

  ngOnInit() {
    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        this.isSidebarCollapsed = collapsed;
        this.adjustContentArea();
      }
    );

    this.paginaActual = 1;
    this.itemsPorPagina = 10;

    this.loadCanales();
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

  loadCanales() {
    this.loading = true;
    this.canalService.getCanales().subscribe({
      next: (data) => {
        this.canales = data;
        this.totalCanales = data.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los canales. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
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
    let result = [...this.canales];

    if (this.searchTerm && this.searchTerm.length >= 2) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(canal =>
        canal.nombreFantasia?.toLowerCase().includes(term) ||
        canal.razonSocial?.toLowerCase().includes(term) ||
        canal.tipoCanal?.toLowerCase().includes(term) ||
        (canal.provincia && canal.provincia.toLowerCase().includes(term))
      );
    }

    if (this.filterActive === 'active') {
      result = result.filter(canal => canal.activo);
    } else if (this.filterActive === 'inactive') {
      result = result.filter(canal => !canal.activo);
    }

    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredCanales = result;
    this.totalCanales = this.filteredCanales.length;
    this.calcularTotalPaginas();
    this.paginarCanales();
  }

  calcularTotalPaginas() {
    this.totalPaginas = Math.ceil(this.filteredCanales.length / this.itemsPorPagina);

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
  }

  paginarCanales() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = Math.min(inicio + this.itemsPorPagina, this.filteredCanales.length);

    this.paginatedCanales = this.filteredCanales.slice(inicio, fin);
  }

  cambiarPagina(pagina: any) {
    const paginaNum = Number(pagina);

    if (isNaN(paginaNum) || paginaNum < 1 || paginaNum > this.totalPaginas) {
      return;
    }

    this.paginaActual = paginaNum;
    this.paginarCanales();
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

  sortData(data: Canal[]): Canal[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      else if (column === 'nombreFantasia' || column === 'tipoCanal') {
        const valueA = (a[column] || '').toLowerCase();
        const valueB = (b[column] || '').toLowerCase();
        return valueA.localeCompare(valueB) * factor;
      }
      else if (column === 'activo') {
        return (a[column] === b[column] ? 0 : a[column] ? -1 : 1) * factor;
      }
      else if (column === 'planes') {
        const countA = this.getPlanesCantidad(a);
        const countB = this.getPlanesCantidad(b);
        return (countA - countB) * factor;
      }
      else if (column === 'subcanales') {
        const countA = this.getSubcanalesCantidad(a);
        const countB = this.getSubcanalesCantidad(b);
        return (countA - countB) * factor;
      }
      else if (column === 'fechaAlta') {
        const dateA = a.fechaAlta ? new Date(a.fechaAlta).getTime() : 0;
        const dateB = b.fechaAlta ? new Date(b.fechaAlta).getTime() : 0;
        return (dateA - dateB) * factor;
      }
      else if (column === 'operaciones') {
        const countA = a.numeroOperaciones || 0;
        const countB = b.numeroOperaciones || 0;
        return (countA - countB) * factor;
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

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  isCanalLoading(canalId: number): boolean {
    return this.loadingCanales.get(canalId) === true;
  }

  toggleCanalEstado(canal: Canal): void {
    this.loadingCanales.set(canal.id, true);

    const request = canal.activo
      ? this.canalService.desactivarCanal(canal.id)
      : this.canalService.activarCanal(canal.id);

    request.subscribe({
      next: (canalActualizado) => {
        this.canales = this.canales.map(c => {
          if (c.id === canal.id) {
            return {...c, activo: !canal.activo};
          }
          return c;
        });

        this.filteredCanales = this.filteredCanales.map(c => {
          if (c.id === canal.id) {
            return {...c, activo: !canal.activo};
          }
          return c;
        });

        this.paginatedCanales = this.paginatedCanales.map(c => {
          if (c.id === canal.id) {
            return {...c, activo: !canal.activo};
          }
          return c;
        });

        this.loadingCanales.set(canal.id, false);
      },
      error: (err) => {
        this.loadingCanales.set(canal.id, false);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '';

    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }

  verDetalle(id: number): void {
    this.router.navigate(['/canales', id]);
  }

  abrirModalEditarCanal(id: number): void {
    this.canalIdEditar = id;
    this.modalEditarOpen = true;
    this.manejarAperturaModal();
  }

  cerrarModalVer() {
    this.modalVerOpen = false;
    this.canalIdVer = null;
    this.manejarCierreModal();
  }

  cerrarModalEditar() {
    this.modalEditarOpen = false;
    this.canalIdEditar = null;
    this.manejarCierreModal();
  }

  onEditarSolicitado(id: number) {
    this.modalVerOpen = false;
    this.canalIdVer = null;

    setTimeout(() => {
      this.abrirModalEditarCanal(id);
    }, 300);
  }

  getPlanesCantidad(canal: Canal): number {
    return canal.planesCanal?.filter(pc => pc.activo)?.length || 0;
  }

  getSubcanalesCantidad(canal: Canal): number {
    return canal.subcanales?.length || 0;
  }

  abrirModalNuevoCanal() {
    this.modalOpen = true;
    this.manejarAperturaModal();
  }

  cerrarModal() {
    this.modalOpen = false;
    this.manejarCierreModal();
  }

  onCanalCreado(canal: Canal) {
    this.paginaActual = 1;
    this.loadCanales();
  }

  onCanalActualizado(canal: Canal) {
    this.loadCanales();
  }

  private manejarAperturaModal() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      this.renderer.addClass(contentArea, 'content-area-with-modal');
      this.renderer.setStyle(document.body, 'position', 'fixed');
      this.renderer.setStyle(document.body, 'width', '100%');
      this.renderer.setStyle(document.body, 'overflow-y', 'scroll');
    }
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
