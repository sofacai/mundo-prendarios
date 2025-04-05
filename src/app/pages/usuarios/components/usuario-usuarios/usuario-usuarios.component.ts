import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioDto, UsuarioService } from 'src/app/core/services/usuario.service';

@Component({
  selector: 'app-usuario-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-usuarios.component.html',
  styleUrls: ['./usuario-usuarios.component.scss']
})
export class UsuarioUsuariosComponent implements OnChanges {
  @Input() usuarios: UsuarioDto[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() tipoUsuario: 'adminCanal' | 'oficialComercial' = 'adminCanal';

  filteredUsuarios: UsuarioDto[] = [];
  searchTerm: string = '';
  sortField: string = 'nombre';
  sortDirection: 'asc' | 'desc' = 'asc';
  loadingUsuarios: Map<number, boolean> = new Map();

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnChanges() {
    this.applyFilters();
  }

  applyFilters() {
    let resultado = [...this.usuarios];

    if (this.searchTerm && this.searchTerm.length > 0) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(usuario =>
        (`${usuario.nombre || ''} ${usuario.apellido || ''}`.toLowerCase().includes(term)) ||
        (usuario.email && usuario.email.toLowerCase().includes(term)) ||
        (usuario.telefono && usuario.telefono.toLowerCase().includes(term))
      );
    }

    resultado = this.sortUsuarios(resultado);
    this.filteredUsuarios = resultado;
  }

  sortUsuarios(usuarios: UsuarioDto[]): UsuarioDto[] {
    return usuarios.sort((a, b) => {
      let comparison = 0;

      switch (this.sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'nombre':
          const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
          const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase();
          comparison = nombreA.localeCompare(nombreB);
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'cantidadOperaciones':
          comparison = (a.cantidadOperaciones || 0) - (b.cantidadOperaciones || 0);
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

  verDetalleUsuario(usuarioId: number) {
    this.router.navigate(['/usuarios', usuarioId]);
  }

  toggleUsuarioEstado(usuario: UsuarioDto) {
    this.loadingUsuarios.set(usuario.id, true);

    const request = usuario.activo
      ? this.usuarioService.desactivarUsuario(usuario.id)
      : this.usuarioService.activarUsuario(usuario.id);

    request.subscribe({
      next: () => {
        usuario.activo = !usuario.activo;
        this.loadingUsuarios.set(usuario.id, false);
      },
      error: () => {
        this.loadingUsuarios.set(usuario.id, false);
      }
    });
  }

  isUsuarioLoading(usuarioId: number): boolean {
    return this.loadingUsuarios.get(usuarioId) === true;
  }

  getRolClass(rolId: number): string {
    switch (rolId) {
      case 1: return '';
      case 2: return 'badge-light-info';
      case 3: return 'badge-light-warning';
      case 4: return 'badge-light-primary';
      default: return '';
    }
  }
}
