// Archivo: src/app/pages/canales/components/canal-planes/canal-planes.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Canal } from 'src/app/core/services/canal.service';

@Component({
  selector: 'app-canal-planes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-planes.component.html',
  styleUrls: ['./canal-planes.component.scss']
})
export class CanalPlanesComponent {
  @Input() canal!: Canal;

  @Output() verDetalle = new EventEmitter<number>();

  constructor() { }

  onVerDetalle(planId: number): void {
    this.verDetalle.emit(planId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }
}
