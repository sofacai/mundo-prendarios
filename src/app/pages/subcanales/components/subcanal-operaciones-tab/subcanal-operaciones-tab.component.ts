import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Operacion, OperacionService } from 'src/app/core/services/operacion.service';

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

  constructor(
    public operacionService: OperacionService  // debe ser público
  ) { }

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
        op.estado?.toLowerCase() === this.estadoFiltro.toLowerCase()
      );
    }
  }

  onVerDetalleOperacion(operacionId: number): void {
    this.verDetalleOperacion.emit(operacionId);
  }

  getBadgeClass(estado: string): string {
    return this.operacionService.getEstadoClass(estado);
  }
  getEstadoColor(estado: string): string {
    return this.operacionService.getEstadoColor(estado);
  }

  formatearMonto(monto: number): string {
    return '$ ' + monto.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
}
