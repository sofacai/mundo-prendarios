// src/app/pages/usuarios/components/usuario-subcanales/usuario-subcanales.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subcanal } from 'src/app/core/services/subcanal.service';

@Component({
  selector: 'app-usuario-subcanales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-subcanales.component.html',
  styleUrls: ['./usuario-subcanales.component.scss']
})
export class UsuarioSubcanalesComponent implements OnChanges {
  @Input() subcanales: Subcanal[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() esAdminCanal: boolean = false;

  @Output() verDetalle = new EventEmitter<number>();

  // Propiedades para filtrado y ordenamiento
  filteredSubcanales: Subcanal[] = [];
  searchTerm: string = '';
  sortField: string = 'nombre';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnChanges() {
    this.applyFilters();
  }

  applyFilters() {
    let resultado = [...this.subcanales];

    // Aplicar búsqueda si hay un término
    if (this.searchTerm && this.searchTerm.length > 0) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(subcanal =>
        (subcanal.nombre && subcanal.nombre.toLowerCase().includes(term)) ||
        (subcanal.canalNombre && subcanal.canalNombre.toLowerCase().includes(term)) ||
        (subcanal.provincia && subcanal.provincia.toLowerCase().includes(term)) ||
        (subcanal.localidad && subcanal.localidad.toLowerCase().includes(term))
      );
    }

    // Aplicar ordenamiento
    resultado = this.sortSubcanales(resultado);

    this.filteredSubcanales = resultado;
  }

  sortSubcanales(subcanales: Subcanal[]): Subcanal[] {
    return subcanales.sort((a, b) => {
      let comparison = 0;

      // Determinar el campo a comparar
      switch (this.sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'nombre':
          comparison = (a.nombre || '').localeCompare(b.nombre || '');
          break;
        case 'canalNombre':
          comparison = (a.canalNombre || '').localeCompare(b.canalNombre || '');
          break;
        case 'provincia':
          comparison = (a.provincia || '').localeCompare(b.provincia || '');
          break;
        case 'localidad':
          comparison = (a.localidad || '').localeCompare(b.localidad || '');
          break;
        case 'comision':
          comparison = (a.comision || 0) - (b.comision || 0);
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

  onVerDetalle(subcanalId: number) {
    this.verDetalle.emit(subcanalId);
  }
}
