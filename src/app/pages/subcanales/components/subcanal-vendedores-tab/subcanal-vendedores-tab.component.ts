import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { UsuarioDto } from 'src/app/core/services/usuario.service';

@Component({
  selector: 'app-subcanal-vendedores-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subcanal-vendedores-tab.component.html',
  styleUrls: ['./subcanal-vendedores-tab.component.scss']
})
export class SubcanalVendedoresTabComponent {
  @Input() subcanal!: Subcanal;
  @Input() loadingVendedores: Map<number, boolean> = new Map();
  @Input() availableVendors: UsuarioDto[] = [];

  @Output() asignarVendedor = new EventEmitter<void>();
  @Output() asignarVendedorConfirmado = new EventEmitter<number>();
  @Output() toggleVendorEstado = new EventEmitter<{ vendorId: number, estadoActual: boolean }>();
  @Output() desasignarVendor = new EventEmitter<number>();
  @Output() verDetalleVendor = new EventEmitter<number>();

  // Modal state
  showModal = false;
  selectedVendorId: string | number = '';
  isLoading = false;

  // Métodos para calcular estadísticas
  @Input() getVendorOperaciones!: (vendorId: number) => number;
  @Input() getVendorClientes!: (vendorId: number) => number;
  @Input() getVendorOperacionesLiquidadas!: (vendorId: number) => number;

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

  // Modal methods
  openModal(): void {
    this.showModal = true;
    this.selectedVendorId = '';
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    // Restore body scroll
    document.body.style.overflow = '';
  }

  confirmarAsignacion(): void {
    if (this.selectedVendorId && !this.isLoading) {
      this.isLoading = true;

      // Emit event with selected vendor id
      this.asignarVendedorConfirmado.emit(Number(this.selectedVendorId));

      // In a real implementation, you would close the modal after the operation completes
      // For now, we'll simulate a delay and close it
      setTimeout(() => {
        this.isLoading = false;
        this.closeModal();
      }, 1000);
    }
  }
}
