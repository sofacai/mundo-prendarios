import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RolType } from 'src/app/core/models/usuario.model';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';

@Component({
  selector: 'app-vendor-selector',
  templateUrl: './vendor-selector.component.html',
  styleUrls: ['./vendor-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class VendorSelectorComponent implements OnInit {
  @Input() vendors: any[] = [];
  @Input() currentUserRol: RolType = RolType.Vendor; // Usar un valor del enum en lugar de 0
  @Output() seleccionarVendor = new EventEmitter<number>();
  @Output() volver = new EventEmitter<void>(); // Nuevo EventEmitter para volver

  vendorId: number | null = null;
  searchTerm: string = '';
  filteredVendors: any[] = [];
  rolNames: {[key: number]: string} = {
    [RolType.Administrador]: 'Administrador',
    [RolType.OficialComercial]: 'Oficial Comercial',
    [RolType.AdminCanal]: 'Administrador de Canal'
  };

  constructor(
    // Mantén los constructores existentes y añade:
    private sidebarStateService: SidebarStateService
  ) {}

  ngOnInit() {
    this.filteredVendors = [...this.vendors];
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleCotizadorSidebar();
  }

  get rolName(): string {
    return this.rolNames[this.currentUserRol] || 'Usuario';
  }

  filterVendors() {
    if (!this.searchTerm) {
      this.filteredVendors = [...this.vendors];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredVendors = this.vendors.filter(vendor =>
      vendor.nombre.toLowerCase().includes(searchLower) ||
      vendor.apellido.toLowerCase().includes(searchLower)
    );
  }

  onSeleccionarVendor() {
    if (this.vendorId) {
      this.seleccionarVendor.emit(this.vendorId);
    }
  }

  selectVendor(vendorId: number) {
    this.vendorId = vendorId;
  }

  onVolver() {
    window.location.href = '/home';
  }
}
