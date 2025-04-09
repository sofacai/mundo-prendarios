import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Operacion } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-subcanal-operaciones-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subcanal-operaciones-tab.component.html',
  styleUrls: ['./subcanal-operaciones-tab.component.scss']
})
export class SubcanalOperacionesTabComponent implements OnChanges {
  @Input() operaciones: Operacion[] = [];
  @Output() verDetalleOperacion = new EventEmitter<number>();

  estadoFiltro: string = 'all';
  operacionesFiltradas: Operacion[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['operaciones']) {
      this.filtrarPorEstado();
    }
  }

  filtrarPorEstado(): void {
    if (this.estadoFiltro === 'all') {
      this.operacionesFiltradas = [...this.operaciones];
    } else {
      this.operacionesFiltradas = this.operaciones.filter(op =>
        op.estado === this.estadoFiltro
      );
    }
  }

  onVerDetalleOperacion(operacionId: number): void {
    this.verDetalleOperacion.emit(operacionId);
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'Liquidada':
        return 'badge-light-success';
      case 'Ingresada':
        return 'badge-light-info';
      case 'Aprobada':
        return 'badge-light-primary';
      case 'Rechazada':
        return 'badge-light-danger';
      case 'En proceso':
        return 'badge-light-warning';
      default:
        return 'badge-light-info';
    }
  }

  formatearMonto(monto: number): string {
    return '$ ' + monto.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
}
