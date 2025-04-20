// Archivo: src/app/pages/canales/components/canal-operaciones/canal-operaciones.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Operacion, OperacionService } from 'src/app/core/services/operacion.service';

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

 constructor(
    public operacionService: OperacionService
  ) { }

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
        op.estado?.toLowerCase() === this.estadoFiltro.toLowerCase()
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
    return this.operacionService.getEstadoClass(estado);
  }

}
