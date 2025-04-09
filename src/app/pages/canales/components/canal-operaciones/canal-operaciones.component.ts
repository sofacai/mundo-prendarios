// Archivo: src/app/pages/canales/components/canal-operaciones/canal-operaciones.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Operacion } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-canal-operaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './canal-operaciones.component.html',
  styleUrls: ['./canal-operaciones.component.scss']
})
export class CanalOperacionesComponent implements OnChanges {
  @Input() operaciones: Operacion[] = [];
  @Output() verDetalle = new EventEmitter<number>();

  estadoFiltro: string = 'all';
  operacionesFiltradas: Operacion[] = [];

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['operaciones']) {
      this.filtrarPorEstado();
    }
  }

  onVerDetalle(operacionId: number): void {
    this.verDetalle.emit(operacionId);
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

  formatearMonto(monto: number): string {
    return '$ ' + monto.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
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
}
