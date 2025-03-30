import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { Gasto } from 'src/app/core/models/gasto.model';

@Component({
  selector: 'app-subcanal-gastos-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcanal-gastos-tab.component.html',
  styleUrls: ['./subcanal-gastos-tab.component.scss']
})
export class SubcanalGastosTabComponent {
  @Input() subcanal!: Subcanal;

  @Output() agregarGasto = new EventEmitter<void>();
  @Output() editarGasto = new EventEmitter<Gasto>();
  @Output() eliminarGasto = new EventEmitter<number>();

  getGastosPorcentaje(): number {
    if (!this.subcanal || !this.subcanal.gastos || this.subcanal.gastos.length === 0) {
      return 0;
    }
    return this.subcanal.gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);
  }

  getTotalGastosClass(): string {
    const total = this.getGastosPorcentaje();
    if (total > 90) return 'text-danger';
    if (total > 70) return 'text-warning';
    return 'text-success';
  }

  onAgregarGasto(): void {
    this.agregarGasto.emit();
  }

  onEditarGasto(gasto: Gasto): void {
    this.editarGasto.emit(gasto);
  }

  onEliminarGasto(gastoId: number): void {
    this.eliminarGasto.emit(gastoId);
  }
}
