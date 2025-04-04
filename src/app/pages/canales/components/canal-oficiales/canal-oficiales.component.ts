// Archivo: src/app/pages/canales/components/canal-oficiales/canal-oficiales.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-canal-oficiales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-oficiales.component.html',
  styleUrls: ['./canal-oficiales.component.scss']
})
export class CanalOficialesComponent {
  @Input() oficialesComerciales: any[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() toggleEstado = new EventEmitter<{oficialId: number, estadoActual: boolean}>();
  @Output() verDetalle = new EventEmitter<number>();


  constructor() { }

  onToggleEstado(oficialId: number, estadoActual: boolean): void {
    this.toggleEstado.emit({ oficialId, estadoActual });
  }

  onVerDetalle(oficialId: number): void {
    this.verDetalle.emit(oficialId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }
}
