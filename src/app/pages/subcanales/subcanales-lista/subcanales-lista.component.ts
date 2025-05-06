import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { SubcanalFormComponent } from 'src/app/shared/modals/subcanal-form/subcanal-form.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { RolType } from 'src/app/core/models/usuario.model';

interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-subcanales-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    IonicModule,
    SubcanalFormComponent
  ],
  templateUrl: './subcanales-lista.component.html',
  styleUrls: ['./subcanales-lista.component.scss']
})
export class SubcanalesListaComponent implements OnInit, OnDestroy {
  subcanales: Subcanal[] = [];
  filteredSubcanales: Subcanal[] = [];
  paginatedSubcanales: Subcanal[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  loadingSubcanales: Map<number, boolean> = new Map();

  isSidebarCollapsed = false;
  isMobile = false;
  private sidebarSubscription: Subscription | null = null;

  searchTerm: string = '';
  searchTimeout: any;
  filterActive: string = 'all';
  sortState: SortState = { column: 'id', direction: 'asc' };

  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalSubcanales: number = 0;
  totalPaginas: number = 1;

  isAdmin: boolean = false;

  constructor(
    private subcanalService: SubcanalService,
    private router: Router,
    private renderer: Renderer2,
    private sidebarStateService: SidebarStateService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Comprobar si estamos en móvil
    this.checkScreenSize();

    // Inicializar el estado del sidebar
    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();

    // Suscribirse a cambios en el sidebar
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        this.isSidebarCollapsed = collapsed;
        this.adjustContentArea();
      }
    );

    this.isAdmin = this.authService.hasRole(RolType.Administrador);

    this.loadSubcanales();
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
    this.adjustContentArea();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 992;
  }

  private adjustContentArea() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      if (this.isMobile) {
        // En móviles, eliminar todos los márgenes
        contentArea.style.marginLeft = '0';
        contentArea.classList.remove('sidebar-collapsed');
        contentArea.classList.remove('sidebar-expanded');
      } else {
        // En desktop, aplicar los márgenes según el estado del sidebar
        if (this.isSidebarCollapsed) {
          contentArea.style.marginLeft = '70px'; // Ancho del sidebar colapsado
          contentArea.classList.add('sidebar-collapsed');
          contentArea.classList.remove('sidebar-expanded');
        } else {
          contentArea.style.marginLeft = '260px'; // Ancho del sidebar expandido
          contentArea.classList.add('sidebar-expanded');
          contentArea.classList.remove('sidebar-collapsed');
        }
      }
    }
  }

  loadSubcanales() {
    this.loading = true;
    this.error = null;

    this.subcanalService.getSubcanales().subscribe({
      next: (data) => {
        this.subcanales = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        // Si es error 403 (Forbidden) - simplemente muestra estado vacío
        if (err.status === 403) {
          this.subcanales = [];
          this.applyFilters();
          this.error = null; // Importante: No mostrar ningún error
        } else {
          this.error = 'No se pudieron cargar los subcanales. Por favor, intente nuevamente.';
        }
        this.loading = false;
      }
    });
  }

  getEmptyStateMessage(): string {
    if (this.error) {
      return this.error;
    } else if (this.authService.hasRole(RolType.OficialComercial)) {
      return "No tiene subcanales asignados. Contacte a un administrador para la asignación de subcanales.";
    } else if (this.authService.hasRole(RolType.AdminCanal)) {
      return "No tiene subcanales asignados a su administración. Contacte a un administrador.";
    } else {
      return "No hay subcanales registrados en el sistema";
    }
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
    let result = [...this.subcanales];

    if (this.searchTerm && this.searchTerm.length >= 2) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(subcanal =>
        subcanal.nombre?.toLowerCase().includes(term) ||
        subcanal.canalNombre?.toLowerCase().includes(term) ||
        subcanal.provincia?.toLowerCase().includes(term) ||
        subcanal.localidad?.toLowerCase().includes(term)
      );
    }

    if (this.filterActive === 'active') {
      result = result.filter(subcanal => subcanal.activo);
    } else if (this.filterActive === 'inactive') {
      result = result.filter(subcanal => !subcanal.activo);
    }

    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredSubcanales = result;
    this.totalSubcanales = this.filteredSubcanales.length;
    this.calcularTotalPaginas();
    this.paginarSubcanales();
  }

  calcularTotalPaginas() {
    this.totalPaginas = Math.ceil(this.filteredSubcanales.length / this.itemsPorPagina);

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
  }

  paginarSubcanales() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = Math.min(inicio + this.itemsPorPagina, this.filteredSubcanales.length);

    this.paginatedSubcanales = this.filteredSubcanales.slice(inicio, fin);
  }

  cambiarPagina(pagina: any) {
    const paginaNum = Number(pagina);

    if (isNaN(paginaNum) || paginaNum < 1 || paginaNum > this.totalPaginas) {
      return;
    }

    this.paginaActual = paginaNum;
    this.paginarSubcanales();
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

  sortData(data: Subcanal[]): Subcanal[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      else if (column === 'nombre' || column === 'provincia') {
        const valueA = (a[column] || '').toLowerCase();
        const valueB = (b[column] || '').toLowerCase();
        return valueA.localeCompare(valueB) * factor;
      }
      else if (column === 'activo') {
        return (a[column] === b[column] ? 0 : a[column] ? -1 : 1) * factor;
      }
      else if (column === 'gastos') {
        const getGastoValue = (subcanal: Subcanal) => {
          const gastoStr = this.getGastosPorcentaje(subcanal);
          return parseFloat(gastoStr.replace('%', '')) || 0;
        };
        return (getGastoValue(a) - getGastoValue(b)) * factor;
      }
      else if (column === 'comision') {
        return (a.comision - b.comision) * factor;
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

  formatComision(comision: number): string {
    return `${comision.toFixed(2)}%`;
  }

  toggleSubcanalEstado(subcanal: Subcanal): void {
    // Verificar si el usuario tiene permisos para cambiar el estado
    if (!this.isAdmin) {
      return;
    }

    this.loadingSubcanales.set(subcanal.id, true);

    const request = subcanal.activo
      ? this.subcanalService.desactivarSubcanal(subcanal.id)
      : this.subcanalService.activarSubcanal(subcanal.id);

    request.subscribe({
      next: (subcanalActualizado) => {
        this.subcanales = this.subcanales.map(s => {
          if (s.id === subcanal.id) {
            return {...s, activo: !subcanal.activo};
          }
          return s;
        });

        this.filteredSubcanales = this.filteredSubcanales.map(s => {
          if (s.id === subcanal.id) {
            return {...s, activo: !subcanal.activo};
          }
          return s;
        });

        this.paginatedSubcanales = this.paginatedSubcanales.map(s => {
          if (s.id === subcanal.id) {
            return {...s, activo: !subcanal.activo};
          }
          return s;
        });

        this.loadingSubcanales.set(subcanal.id, false);
      },
      error: (err) => {
        // Mostrar mensaje de error específico para activación rechazada
        if (!subcanal.activo && err?.message?.includes('canal padre está inactivo')) {
          alert('No se puede activar un subcanal cuando su canal está inactivo.');
        }

        this.loadingSubcanales.set(subcanal.id, false);
      }
    });
  }

  isSubcanalLoading(subcanalId: number): boolean {
    return this.loadingSubcanales.get(subcanalId) === true;
  }

  verDetalle(id: number): void {
    this.router.navigate(['/subcanales', id]);
  }

  getGastosPorcentaje(subcanal: Subcanal): string {
    if (!subcanal.gastos || subcanal.gastos.length === 0) {
      return '0%';
    }

    const totalPorcentaje = subcanal.gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);
    return `${totalPorcentaje}%`;
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  abrirModalNuevoSubcanal() {
    this.modalOpen = true;
    this.manejarAperturaModal();
  }

  cerrarModal() {
    this.modalOpen = false;
    this.manejarCierreModal();
  }

  onSubcanalCreado(subcanal: Subcanal) {
    this.loadSubcanales();
  }

  onSubcanalActualizado(subcanal: Subcanal) {
    this.loadSubcanales();
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
    if (!this.modalOpen) {
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
