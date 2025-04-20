// src/app/pages/usuarios/components/usuario-operaciones/usuario-operaciones.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Operacion, OperacionService } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-usuario-operaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-operaciones.component.html',
  styleUrls: ['./usuario-operaciones.component.scss']
})
export class UsuarioOperacionesComponent implements OnChanges, OnInit {
  @Input() operaciones: Operacion[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() verDetalle = new EventEmitter<number>();

  // Propiedades para filtrado y ordenamiento
  operacionesFiltradas: Operacion[] = [];
  sortField: string = 'id'; // Default sort by ID
  sortDirection: 'asc' | 'desc' = 'desc'; // Default order is descending (newest first)
  estadoFiltro: string = 'all';

   constructor(
    public operacionService: OperacionService
  ) { }

  ngOnInit(): void {
    // Aseguramos que se aplique el ordenamiento inicial
    this.aplicarFiltrosYOrden();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['operaciones']) {
      this.aplicarFiltrosYOrden();
    }
  }

  // Método centralizado para aplicar filtros y ordenamiento
  aplicarFiltrosYOrden(): void {
    this.filtrarPorEstado();
    this.ordenarOperaciones();
  }

  filtrarPorEstado(): void {
    if (this.estadoFiltro === 'all') {
      this.operacionesFiltradas = [...this.operaciones];
    } else {
      this.operacionesFiltradas = this.operaciones.filter(op =>
        op.estado?.toLowerCase() === this.estadoFiltro.toLowerCase()
      );
    }
  }

  // Método para aplicar el ordenamiento después del filtrado
  ordenarOperaciones(): void {
    this.operacionesFiltradas = this.sortOperaciones([...this.operacionesFiltradas]);
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

    // Aplicar solo el ordenamiento, ya que los filtros no cambiaron
    this.ordenarOperaciones();
  }

  getSortClass(field: string): string {
    if (this.sortField !== field) return 'bi-arrow-down-up text-muted';

    return this.sortDirection === 'asc'
      ? 'bi-sort-down-alt'
      : 'bi-sort-up-alt';
  }

  onVerDetalle(operacionId: number) {
    this.verDetalle.emit(operacionId);
  }

  // Formatear moneda con separador de miles
  formatearMonto(monto: number): string {
    return '$ ' + monto.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  // Formatear fecha
  formatDate(date: Date | undefined | null): string {
    if (!date) return '';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Obtener clase para el estado
  getBadgeClass(estado: string): string {
    return this.operacionService.getEstadoClass(estado);
  }
}
