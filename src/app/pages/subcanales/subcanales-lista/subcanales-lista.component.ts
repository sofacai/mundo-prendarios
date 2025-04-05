import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { SubcanalFormComponent } from 'src/app/shared/modals/subcanal-form/subcanal-form.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';

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
  loading = false;
  error: string | null = null;
  modalOpen = false;
  scrollbarWidth: number = 0;
  loadingSubcanales: Map<number, boolean> = new Map();

  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;
  sidebarLayoutLocked = false;

  searchTerm: string = '';
  searchTimeout: any;
  filterActive: string = 'all';
  sortState: SortState = { column: '', direction: 'asc' };

  constructor(
    private subcanalService: SubcanalService,
    private router: Router,
    private renderer: Renderer2,
    private sidebarStateService: SidebarStateService
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

    this.loadSubcanales();
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

  loadSubcanales() {
    this.loading = true;
    this.error = null;
    this.sidebarLayoutLocked = true;

    this.subcanalService.getSubcanales().subscribe({
      next: (data) => {
        this.subcanales = data;
        this.applyFilters();
        this.loading = false;
        this.sidebarLayoutLocked = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los subcanales. Por favor, intente nuevamente.';
        this.loading = false;
        this.sidebarLayoutLocked = false;
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.subcanales];

    if (this.searchTerm && this.searchTerm.length >= 3) {
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

        this.loadingSubcanales.set(subcanal.id, false);
      },
      error: (err) => {
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
