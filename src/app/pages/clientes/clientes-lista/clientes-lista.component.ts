import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';

// Definición del DTO para cliente
export interface ClienteDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  activo: boolean;
}

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
    // Los componentes de modal se importarán cuando estén creados
  ],
  templateUrl: './clientes-lista.component.html',
  styleUrls: ['./clientes-lista.component.scss']
})
export class ClientesListaComponent implements OnInit {
  clientes: ClienteDto[] = [];
  filteredClientes: ClienteDto[] = []; // Lista filtrada para mostrar
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  clienteIdEditar: number | null = null;
  clienteIdVer: number | null = null;
  scrollbarWidth: number = 0;

  // Búsqueda y ordenamiento
  searchTerm: string = '';
  searchTimeout: any;
  sortState: SortState = { column: '', direction: 'asc' };

  constructor(
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.loadClientes();
    // Calcular el ancho de la barra de desplazamiento
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  }

  loadClientes() {
    this.loading = true;

    // Como mencionaste que la base está vacía, vamos a simular datos
    setTimeout(() => {
      this.clientes = [
        {
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan.perez@example.com',
          telefono: '+54 11 1234-5678',
          activo: true
        },
        {
          id: 2,
          nombre: 'María',
          apellido: 'González',
          email: 'maria.gonzalez@example.com',
          telefono: '+54 11 8765-4321',
          activo: true
        },
        {
          id: 3,
          nombre: 'Carlos',
          apellido: 'Rodríguez',
          email: 'carlos.rodriguez@example.com',
          telefono: '+54 11 5555-6666',
          activo: false
        }
      ];
      this.applyFilters(); // Aplicar filtros y ordenamiento iniciales
      this.loading = false;
    }, 1000); // Simular delay de red

    // El servicio real se implementará después
    /*
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.applyFilters(); // Aplicar filtros y ordenamiento iniciales
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.error = 'No se pudieron cargar los clientes. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
    */
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
    let result = [...this.clientes];

    // Aplicar búsqueda si hay término
    if (this.searchTerm && this.searchTerm.length >= 3) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(cliente =>
        cliente.nombre.toLowerCase().includes(term) ||
        cliente.apellido.toLowerCase().includes(term) ||
        cliente.email.toLowerCase().includes(term)
      );
    }

    // Aplicar ordenamiento si está configurado
    if (this.sortState.column) {
      result = this.sortData(result);
    }

    this.filteredClientes = result;
  }

  // Ordenar los datos según la columna seleccionada
  sortData(data: ClienteDto[]): ClienteDto[] {
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
      // Para ordenar por teléfono
      else if (column === 'telefono') {
        return a.telefono.localeCompare(b.telefono) * factor;
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

  // Navegar al detalle del cliente
  verDetalle(id: number): void {
    this.clienteIdVer = id;
    this.modalVerOpen = true;
    this.manejarAperturaModal();
  }

  // Abre el modal para nuevo cliente
  abrirModalNuevoCliente() {
    console.log('Abrir modal para nuevo cliente');
    // Implementación futura
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
