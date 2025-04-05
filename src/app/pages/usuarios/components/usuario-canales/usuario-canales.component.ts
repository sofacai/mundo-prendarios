// src/app/pages/usuarios/components/usuario-canales/usuario-canales.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Canal } from 'src/app/core/services/canal.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuario-canales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-canales.component.html',
  styleUrls: ['./usuario-canales.component.scss']
})
export class UsuarioCanalesComponent implements OnChanges {
  @Input() canales: Canal[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() verDetalle = new EventEmitter<number>();

  // Propiedades para filtrado y ordenamiento
  filteredCanales: Canal[] = [];
  searchTerm: string = '';
  sortField: string = 'nombreFantasia';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private router: Router) {}


  ngOnChanges() {
    this.applyFilters();
  }

  applyFilters() {
    let resultado = [...this.canales];

    // Aplicar búsqueda si hay un término
    if (this.searchTerm && this.searchTerm.length > 0) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(canal =>
        (canal.nombreFantasia && canal.nombreFantasia.toLowerCase().includes(term)) ||
        (canal.razonSocial && canal.razonSocial.toLowerCase().includes(term)) ||
        (canal.provincia && canal.provincia.toLowerCase().includes(term)) ||
        (canal.localidad && canal.localidad.toLowerCase().includes(term)) ||
        (canal.tipoCanal && canal.tipoCanal.toLowerCase().includes(term))
      );
    }

    // Aplicar ordenamiento
    resultado = this.sortCanales(resultado);

    this.filteredCanales = resultado;
  }

  sortCanales(canales: Canal[]): Canal[] {
    return canales.sort((a, b) => {
      let comparison = 0;

      // Determinar el campo a comparar
      switch (this.sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'nombreFantasia':
          comparison = (a.nombreFantasia || '').localeCompare(b.nombreFantasia || '');
          break;
        case 'razonSocial':
          comparison = (a.razonSocial || '').localeCompare(b.razonSocial || '');
          break;
        case 'provincia':
          comparison = (a.provincia || '').localeCompare(b.provincia || '');
          break;
        case 'localidad':
          comparison = (a.localidad || '').localeCompare(b.localidad || '');
          break;
        case 'tipoCanal':
          comparison = (a.tipoCanal || '').localeCompare(b.tipoCanal || '');
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

  onVerDetalle(canalId: number) {
    this.verDetalle.emit(canalId);
  }

  onCanalNombreClick(canalId: number) {
    this.router.navigate(['/canales', canalId]);
  }

}
