import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { Operacion } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-subcanal-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subcanal-header.component.html',
  styleUrls: ['./subcanal-header.component.scss']
})
export class SubcanalHeaderComponent implements OnChanges {
  @Input() subcanal!: Subcanal;
  @Input() loading = false;
  @Input() vendedoresActivos = 0;
  @Input() vendedoresInactivos = 0;
  @Input() clientesTotal = 0;
  @Input() operacionesTotal = 0;
  @Input() operaciones: Operacion[] = [];
  @Input() operacionesLiquidadas = 0;
  @Input() operacionesRechazadas = 0;

  @Output() toggleEstado = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    // Recalcular estadísticas cuando cambien las operaciones
    if (changes['operaciones'] && this.operaciones) {
      this.calcularEstadisticas();
    }
  }

  getGastosPorcentaje(): number {
    if (!this.subcanal || !this.subcanal.gastos || this.subcanal.gastos.length === 0) {
      return 0;
    }
    return this.subcanal.gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);
  }

  calcularEstadisticas() {
    // Calcular operaciones liquidadas
    this.operacionesLiquidadas = this.operaciones.filter(op => op.estado && op.estado.toLowerCase() === 'liquidada').length;

    // Calcular operaciones rechazadas
    this.operacionesRechazadas = this.operaciones.filter(op => op.estado && op.estado.toLowerCase() === 'rechazada').length;
  }
}
