// src/app/pages/usuarios/components/usuario-operaciones/usuario-operaciones.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Operacion } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-usuario-operaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-operaciones.component.html',
  styleUrls: ['./usuario-operaciones.component.scss']
})
export class UsuarioOperacionesComponent implements OnChanges {
  @Input() operaciones: Operacion[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() verDetalle = new EventEmitter<number>();

  // Propiedades para filtrado y ordenamiento
  filteredOperaciones: Operacion[] = [];
  searchTerm: string = '';
  sortField: string = 'fechaCreacion';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnChanges() {
    this.applyFilters();
  }

  applyFilters() {
    let resultado = [...this.operaciones];

    // Aplicar búsqueda si hay un término
    if (this.searchTerm && this.searchTerm.length > 0) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(op =>
        (op.clienteNombre && op.clienteNombre.toLowerCase().includes(term)) ||
        (op.planNombre && op.planNombre.toLowerCase().includes(term)) ||
        (op.estado && op.estado.toLowerCase().includes(term))
      );
    }

    // Aplicar ordenamiento
    resultado = this.sortOperaciones(resultado);

    this.filteredOperaciones = resultado;
  }

  sortOperaciones(operaciones: Operacion[]): Operacion[] {
    return operaciones.sort((a, b) => {
      let comparison = 0;

      // Determinar el campo a comparar
      switch (this.sortField) {
        case 'id':
          comparison = (a.id || 0) - (b.id || 0);
          break;
        case 'monto':
          comparison = a.monto - b.monto;
          break;
        case 'meses':
          comparison = a.meses - b.meses;
          break;
        case 'tasa':
          comparison = a.tasa - b.tasa;
          break;
        case 'cliente':
          comparison = (a.clienteNombre || '').localeCompare(b.clienteNombre || '');
          break;
        case 'fechaCreacion':
          const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
          const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
          comparison = dateA - dateB;
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

  onVerDetalle(operacionId: number) {
    this.verDetalle.emit(operacionId);
  }

  // Formatear moneda
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  // Formatear fecha
  formatDate(date: Date | undefined | null): string {
    if (!date) return '';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Obtener clase para el estado
  getEstadoClass(estado: string | undefined): string {
    if (!estado) return 'badge-light-warning';

    switch (estado.toLowerCase()) {
      case 'aprobado':
      case 'completado':
        return 'badge-light-success';
      case 'rechazado':
      case 'cancelado':
        return 'badge-light-danger';
      case 'pendiente':
        return 'badge-light-warning';
      case 'en proceso':
        return 'badge-light-info';
      default:
        return 'badge-light-info';
    }
  }
}
