// Archivo: src/app/pages/canales/components/canal-subcanales/canal-subcanales.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subcanal } from 'src/app/core/services/subcanal.service';

@Component({
  selector: 'app-canal-subcanales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-subcanales.component.html',
  styleUrls: ['./canal-subcanales.component.scss']
})
export class CanalSubcanalesComponent {
  @Input() subcanales: Subcanal[] = [];
  @Input() loading: boolean = false;
  @Input() loadingSubcanales: Map<number, boolean> = new Map();

  @Output() toggleEstado = new EventEmitter<{subcanalId: number, estadoActual: boolean}>();
  @Output() verDetalle = new EventEmitter<number>();

  constructor() { }

  onToggleEstado(subcanalId: number, estadoActual: boolean): void {
    this.toggleEstado.emit({ subcanalId, estadoActual });
  }

  onVerDetalle(subcanalId: number): void {
    this.verDetalle.emit(subcanalId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  isSubcanalLoading(subcanalId: number): boolean {
    return this.loadingSubcanales.get(subcanalId) === true;
  }
}
