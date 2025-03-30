import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Operacion } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-subcanal-operaciones-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcanal-operaciones-tab.component.html',
  styleUrls: ['./subcanal-operaciones-tab.component.scss']
})
export class SubcanalOperacionesTabComponent {
  @Input() operaciones: Operacion[] = [];

  @Output() filtrarOperaciones = new EventEmitter<void>();
  @Output() verDetalleOperacion = new EventEmitter<number>();

  onFiltrarOperaciones(): void {
    this.filtrarOperaciones.emit();
  }

  onVerDetalleOperacion(operacionId: number): void {
    this.verDetalleOperacion.emit(operacionId);
  }
}
