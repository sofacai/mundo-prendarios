import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { Cliente, ClienteService } from 'src/app/core/services/cliente.service';
import { ModalVerClienteComponent } from 'src/app/shared/modals/modal-ver-clientes/modal-ver-clientes.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';

// Tipo para ordenamiento
interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-clientes-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    IonicModule,
    ModalVerClienteComponent
  ],
  templateUrl: './clientes-lista.component.html',
  styleUrls: ['./clientes-lista.component.scss']
})
export class ClientesListaComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  filteredClientes: Cliente[] = []; // Lista filtrada para mostrar
  loading = true;
  error: string | null = null;
  modalVerOpen = false;
  clienteIdVer: number | null = null;
  scrollbarWidth: number = 0;

  // Sidebar collapsed state
  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;
  sidebarLayoutLocked = false;


  // Búsqueda y ordenamiento
  searchTerm: string = '';
  searchTimeout: any;
  filterActive: string = 'all'; // 'all' por defecto
  sortState: SortState = { column: '', direction: 'asc' };

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private clienteService: ClienteService,
    private sidebarStateService: SidebarStateService
  ) { }

  ngOnInit() {
    // Lock sidebar state immediately
    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarLayoutLocked = true;
    this.adjustContentArea();

    // Subscribe for future changes only
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        if (this.sidebarLayoutLocked) {
          // Only update if not loading data
          this.isSidebarCollapsed = collapsed;
          this.adjustContentArea();
        }
      }
    );

    // Now load data when layout is established
    this.loadClientes();
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
        contentArea.style.marginLeft = '70px'; // Ancho del sidebar colapsado
      } else {
        contentArea.style.marginLeft = '260px'; // Ancho del sidebar expandido
      }
    }
  }

  loadClientes() {
    this.loading = true;
    this.error = null;

    // Lock sidebar during loading
    this.sidebarLayoutLocked = true;

    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.applyFilters();
        this.loading = false;
        // Unlock sidebar when done
        this.sidebarLayoutLocked = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.error = 'No se pudieron cargar los clientes. Por favor, intente nuevamente.';
        this.loading = false;
        // Unlock sidebar when done
        this.sidebarLayoutLocked = false;
      }
    });
  }

  // Rest of the component remains unchanged
  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      console.log(`Searching for: "${this.searchTerm}"`);
      this.applyFilters();
    }, 300);
  }

  clearSearch() {
    console.log('Clearing search');
    this.searchTerm = '';
    this.applyFilters();
  }

  applyFilters() {
    console.log('Applying filters. Search term:', this.searchTerm);
    let result = [...this.clientes];

    if (this.searchTerm && this.searchTerm.length >= 3) {
      const term = this.searchTerm.toLowerCase();
      console.log(`Filtering by term: "${term}"`);
      result = result.filter(cliente =>
        cliente.nombre?.toLowerCase().includes(term) ||
        cliente.apellido?.toLowerCase().includes(term) ||
        cliente.email?.toLowerCase().includes(term) ||
        cliente.telefono?.toLowerCase().includes(term) ||
        (cliente.dni && cliente.dni.toLowerCase().includes(term)) ||
        (cliente.cuil && cliente.cuil.toLowerCase().includes(term))
      );
      console.log(`After filtering: ${result.length} results`);
    }

    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredClientes = result;
    console.log(`Final filtered results: ${this.filteredClientes.length}`);
  }

  sortData(data: Cliente[]): Cliente[] {
    const { column, direction } = this.sortState;
    const factor = direction === 'asc' ? 1 : -1;

    return [...data].sort((a: any, b: any) => {
      if (column === 'id') {
        return (a.id - b.id) * factor;
      }
      else if (column === 'fechaCreacion') {
        const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
        const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
        return (dateA - dateB) * factor;
      }
      else if (column === 'ultimaModificacion') {
        if (!a.ultimaModificacion) return factor;
        if (!b.ultimaModificacion) return -factor;
        return (new Date(a.ultimaModificacion).getTime() - new Date(b.ultimaModificacion).getTime()) * factor;
      }
      else if (column === 'nombre') {
        const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
        const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase();
        return nombreA.localeCompare(nombreB) * factor;
      }
      else if (column === 'email') {
        return (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase()) * factor;
      }
      else if (column === 'telefono') {
        return (a.telefono || '').localeCompare((b.telefono || '')) * factor;
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

  formatDate(date: Date | string | null | undefined, cliente?: Cliente): string {
    if (!date && cliente) {
      date = cliente.fechaCreacion;
    }

    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = String(dateObj.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
  }

  verDetalle(id: number): void {
    this.clienteIdVer = id;
    this.modalVerOpen = true;
    this.manejarAperturaModal();
  }

  onCloseVerModal() {
    this.modalVerOpen = false;
    this.clienteIdVer = null;
    this.manejarCierreModal();
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
    if (!this.modalVerOpen) {
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
