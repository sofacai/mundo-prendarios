import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RolType } from 'src/app/core/models/usuario.model';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { CotizadorDataService } from 'src/app/core/services/cotizador-data.service';

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
  @Output() crearOperacionSinVendor = new EventEmitter<void>(); // Nueva emisión para operación propia
  @Output() volver = new EventEmitter<void>();

  vendorId: number | null = null;
  searchTerm: string = '';
  filteredVendors: any[] = [];
  crearOperacionPropia: boolean = false; // Nueva propiedad

  modoSimulacion: boolean = false;
mostrarOpcionSimulacion: boolean = false;

  rolNames: {[key: number]: string} = {
    [RolType.Administrador]: 'Administrador',
    [RolType.OficialComercial]: 'Oficial Comercial',
    [RolType.AdminCanal]: 'Administrador de Canal'
  };

  constructor(
    private sidebarStateService: SidebarStateService,
    private dataService: CotizadorDataService
  ) {}

  ngOnInit() {
    this.filteredVendors = [...this.vendors];

    const esRolConPermiso = this.currentUserRol === 1 || this.currentUserRol === 4;
    this.mostrarOpcionSimulacion = esRolConPermiso;
  }

  onModoSimulacionChange() {
    // Guardar el estado en el servicio compartido
    this.dataService.modoSimulacion = this.modoSimulacion;
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

  onCrearOperacionPropiaChange() {
    // Si selecciona crear operación propia, deseleccionamos el vendedor
    if (this.crearOperacionPropia) {
      this.vendorId = null;
    }
  }

  onSeleccionarVendor() {
    // Guardar modo simulación en el servicio
    this.dataService.modoSimulacion = this.modoSimulacion;

    if (this.crearOperacionPropia) {
      // Emitir evento para crear operación sin vendedor
      this.crearOperacionSinVendor.emit();
    } else if (this.vendorId) {
      // Emitir evento con el vendedor seleccionado
      this.seleccionarVendor.emit(this.vendorId);
    }
  }

  selectVendor(vendorId: number) {
    this.vendorId = vendorId;
    // Desactivar la opción de crear operación propia cuando se selecciona un vendedor
    this.crearOperacionPropia = false;
  }

  onVolver() {
    window.location.href = '/home';
  }
}
