import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SubcanalInfo } from 'src/app/core/services/cotizador.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';

@Component({
  selector: 'app-subcanal-selector',
  templateUrl: './subcanal-selector.component.html',
  styleUrls: ['./subcanal-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class SubcanalSelectorComponent implements OnInit {
  @Input() subcanales: SubcanalInfo[] = [];
  @Output() seleccionarSubcanal = new EventEmitter<number>();

  subcanalId: number | null = null;
  subcanalesActivos: SubcanalInfo[] = [];
  errorMessage: string | null = null;

  constructor(
    // Mantén los constructores existentes y añade:
    private sidebarStateService: SidebarStateService
  ) {}

  ngOnInit() {
    // Filtrar solo subcanales activos
    this.subcanalesActivos = this.subcanales.filter(subcanal => subcanal.subcanalActivo);

    if (this.subcanalesActivos.length === 0) {
      this.errorMessage = "No hay subcanales activos disponibles. Contacta a tu administrador.";
    } else if (this.subcanalesActivos.length === 1) {
      // Si solo hay un subcanal activo, preseleccionarlo
      this.subcanalId = this.subcanalesActivos[0].subcanalId;
    }
  }
  toggleSidebar(): void {
    this.sidebarStateService.toggleCotizadorSidebar();
  }

  onSeleccionarSubcanal() {
    if (this.subcanalId) {
      this.seleccionarSubcanal.emit(this.subcanalId);
    } else {
      this.errorMessage = "Debes seleccionar un subcanal para continuar.";
    }
  }
}
