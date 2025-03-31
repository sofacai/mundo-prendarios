// src/app/pages/usuarios/components/usuario-clientes/usuario-clientes.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente } from 'src/app/core/services/cliente.service';

@Component({
  selector: 'app-usuario-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-clientes.component.html',
  styleUrls: ['./usuario-clientes.component.scss']
})
export class UsuarioClientesComponent implements OnChanges {
  @Input() clientes: Cliente[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() verDetalle = new EventEmitter<number>();

  // Propiedades para filtrado y ordenamiento
  filteredClientes: Cliente[] = [];
  searchTerm: string = '';
  sortField: string = 'apellido';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnChanges() {
    this.applyFilters();
  }

  applyFilters() {
    let resultado = [...this.clientes];

    // Aplicar búsqueda si hay un término
    if (this.searchTerm && this.searchTerm.length > 0) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(cliente =>
        (cliente.nombre && cliente.nombre.toLowerCase().includes(term)) ||
        (cliente.apellido && cliente.apellido.toLowerCase().includes(term)) ||
        (cliente.email && cliente.email.toLowerCase().includes(term)) ||
        (cliente.telefono && cliente.telefono.toLowerCase().includes(term)) ||
        (cliente.dni && cliente.dni.toLowerCase().includes(term)) ||
        (cliente.cuil && cliente.cuil.toLowerCase().includes(term))
      );
    }

    // Aplicar ordenamiento
    resultado = this.sortClientes(resultado);

    this.filteredClientes = resultado;
  }

  sortClientes(clientes: Cliente[]): Cliente[] {
    return clientes.sort((a, b) => {
      let comparison = 0;

      // Determinar el campo a comparar
      switch (this.sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'nombre':
          comparison = (a.nombre || '').localeCompare(b.nombre || '');
          break;
        case 'apellido':
          comparison = (a.apellido || '').localeCompare(b.apellido || '');
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'telefono':
          comparison = (a.telefono || '').localeCompare(b.telefono || '');
          break;
        case 'operaciones':
          comparison = (a.numeroOperaciones || 0) - (b.numeroOperaciones || 0);
          break;
        case 'provincia':
          comparison = (a.provincia || '').localeCompare(b.provincia || '');
          break;
        default:
          comparison = 0;
      }

      // Aplicar dirección
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onSortChange(field: string) {
    if (this.sortField === field) {
      // Si ya estamos ordenando por este campo, invertir dirección
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nuevo campo, establecer dirección predeterminada
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.applyFilters();
  }

  getSortClass(field: string): string {
    if (this.sortField !== field) return 'bi-arrow-down-up text-muted';

    return this.sortDirection === 'asc'
      ? 'bi-sort-down-alt'
      : 'bi-sort-up-alt';
  }

  onSearchChange() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  onVerDetalle(clienteId: number) {
    this.verDetalle.emit(clienteId);
  }

  // Obtener nombre completo del cliente
  getNombreCompleto(cliente: Cliente): string {
    return `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
  }

  // Formatear fecha
  formatDate(date: Date | undefined | null): string {
    if (!date) return '';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
}
