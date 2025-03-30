import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from 'src/app/core/services/cliente.service';
import { Subcanal } from 'src/app/core/services/subcanal.service';

@Component({
  selector: 'app-subcanal-clientes-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcanal-clientes-tab.component.html',
  styleUrls: ['./subcanal-clientes-tab.component.scss']
})
export class SubcanalClientesTabComponent {
  @Input() clientes: Cliente[] = [];
  @Input() subcanal!: Subcanal;

  @Output() filtrarClientes = new EventEmitter<void>();
  @Output() verDetalleCliente = new EventEmitter<number>();

  @Input() getVendorNombre!: (vendorId: number) => string;

  onVerDetalleCliente(clienteId: number): void {
    this.verDetalleCliente.emit(clienteId);
  }

  onFiltrarClientes(): void {
    this.filtrarClientes.emit();
  }
}
