import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subcanal } from 'src/app/core/services/subcanal.service';

@Component({
  selector: 'app-subcanal-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subcanal-header.component.html',
  styleUrls: ['./subcanal-header.component.scss']
})
export class SubcanalHeaderComponent {
  @Input() subcanal!: Subcanal;
  @Input() loading = false;
  @Input() vendedoresActivos = 0;
  @Input() vendedoresInactivos = 0;
  @Input() clientesTotal = 0;
  @Input() operacionesTotal = 0;

  @Output() toggleEstado = new EventEmitter<void>();

  getGastosPorcentaje(): number {
    if (!this.subcanal || !this.subcanal.gastos || this.subcanal.gastos.length === 0) {
      return 0;
    }
    return this.subcanal.gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);
  }
}
