// Archivo: src/app/pages/canales/components/canal-operaciones/canal-operaciones.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Operacion } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-canal-operaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-operaciones.component.html',
  styleUrls: ['./canal-operaciones.component.scss']
})
export class CanalOperacionesComponent {
  @Input() operaciones: Operacion[] = [];

  @Output() verDetalle = new EventEmitter<number>();
  @Output() filtrar = new EventEmitter<void>();

  constructor() { }

  onVerDetalle(operacionId: number): void {
    this.verDetalle.emit(operacionId);
  }

  onFiltrar(): void {
    this.filtrar.emit();
  }
}
