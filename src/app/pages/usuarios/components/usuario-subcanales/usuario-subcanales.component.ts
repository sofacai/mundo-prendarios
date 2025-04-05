import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { SubcanalService } from 'src/app/core/services/subcanal.service';

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
  @Output() toggleEstado = new EventEmitter<{id: number, activo: boolean}>();

  filteredSubcanales: Subcanal[] = [];
  searchTerm: string = '';
  sortField: string = 'nombre';
  sortDirection: 'asc' | 'desc' = 'asc';
  loadingSubcanales: Map<number, boolean> = new Map();

  constructor(
    private router: Router,
    private subcanalService: SubcanalService
  ) {}

  ngOnChanges() {
    this.applyFilters();
  }

  applyFilters() {
    let resultado = [...this.subcanales];

    if (this.searchTerm && this.searchTerm.length > 0) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(subcanal =>
        (subcanal.nombre && subcanal.nombre.toLowerCase().includes(term)) ||
        (subcanal.canalNombre && subcanal.canalNombre.toLowerCase().includes(term)) ||
        (subcanal.provincia && subcanal.provincia.toLowerCase().includes(term)) ||
        (subcanal.localidad && subcanal.localidad.toLowerCase().includes(term))
      );
    }

    resultado = this.sortSubcanales(resultado);
    this.filteredSubcanales = resultado;
  }

  sortSubcanales(subcanales: Subcanal[]): Subcanal[] {
    return subcanales.sort((a, b) => {
      let comparison = 0;

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
        default:
          comparison = 0;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onSortChange(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
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

  navigateToSubcanal(subcanalId: number) {
    this.router.navigate(['/subcanales', subcanalId]);
  }

  navigateToCanal(canalId: number) {
    this.router.navigate(['/canales', canalId]);
  }

  toggleSubcanalEstado(subcanal: Subcanal) {
    this.loadingSubcanales.set(subcanal.id, true);

    const request = subcanal.activo
      ? this.subcanalService.desactivarSubcanal(subcanal.id)
      : this.subcanalService.activarSubcanal(subcanal.id);

    request.subscribe({
      next: () => {
        subcanal.activo = !subcanal.activo;
        this.loadingSubcanales.set(subcanal.id, false);
        this.toggleEstado.emit({id: subcanal.id, activo: subcanal.activo});
      },
      error: () => {
        this.loadingSubcanales.set(subcanal.id, false);
      }
    });
  }

  isSubcanalLoading(subcanalId: number): boolean {
    return this.loadingSubcanales.get(subcanalId) === true;
  }
}
