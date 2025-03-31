// Archivo: src/app/pages/canales/components/canal-vendedores/canal-vendedores.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-canal-vendedores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-vendedores.component.html',
  styleUrls: ['./canal-vendedores.component.scss']
})
export class CanalVendedoresComponent {
  @Input() vendedores: any[] = [];
  @Input() loadingVendedores: Map<number, boolean> = new Map();

  @Output() toggleEstado = new EventEmitter<{vendorId: number, estadoActual: boolean}>();
  @Output() verDetalle = new EventEmitter<number>();

  constructor() { }

  onToggleEstado(vendorId: number, estadoActual: boolean): void {
    this.toggleEstado.emit({ vendorId, estadoActual });
  }

  onVerDetalle(vendorId: number): void {
    this.verDetalle.emit(vendorId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  isVendorLoading(vendorId: number): boolean {
    return this.loadingVendedores.get(vendorId) === true;
  }
}
