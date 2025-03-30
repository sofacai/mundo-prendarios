import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { UsuarioDto } from 'src/app/core/services/usuario.service';

@Component({
  selector: 'app-subcanal-vendedores-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcanal-vendedores-tab.component.html',
  styleUrls: ['./subcanal-vendedores-tab.component.scss']
})
export class SubcanalVendedoresTabComponent {
  @Input() subcanal!: Subcanal;
  @Input() loadingVendedores: Map<number, boolean> = new Map();

  @Output() asignarVendedor = new EventEmitter<void>();
  @Output() toggleVendorEstado = new EventEmitter<{ vendorId: number, estadoActual: boolean }>();
  @Output() desasignarVendor = new EventEmitter<number>();
  @Output() verDetalleVendor = new EventEmitter<number>();

  // Métodos para calcular estadísticas
  @Input() getVendorOperaciones!: (vendorId: number) => number;
  @Input() getVendorClientes!: (vendorId: number) => number;

  isVendorLoading(vendorId: number): boolean {
    return this.loadingVendedores.get(vendorId) === true;
  }

  onToggleVendorEstado(vendorId: number, estadoActual: boolean): void {
    this.toggleVendorEstado.emit({ vendorId, estadoActual });
  }

  onDesasignarVendor(vendorId: number): void {
    this.desasignarVendor.emit(vendorId);
  }

  onVerDetalleVendor(vendorId: number): void {
    this.verDetalleVendor.emit(vendorId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }
}
