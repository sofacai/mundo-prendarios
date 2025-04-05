// src/app/pages/usuarios/components/usuario-tabs-navigation/usuario-tabs-navigation.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolType } from 'src/app/core/models/usuario.model';

interface Tab {
  id: string;
  label: string;
  icon: string;
  roles: number[]; // Roles que pueden ver esta pestaña
}

@Component({
  selector: 'app-usuario-tabs-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-tabs-navigation.component.html',
  styleUrls: ['./usuario-tabs-navigation.component.scss']
})
export class UsuarioTabsNavigationComponent implements OnChanges {
  @Input() activeTab: string = 'operaciones';
  @Input() usuarioRol: number = 0;
  @Output() tabChange = new EventEmitter<string>();

  visibleTabs: Tab[] = [];

  // Todas las pestañas posibles
  allTabs: Tab[] = [
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: 'bi-cash',
      roles: [RolType.Vendor]
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: 'bi-people',
      roles: [RolType.Vendor, RolType.AdminCanal, RolType.OficialComercial]
    },
    {
      id: 'subcanales',
      label: 'Subcanales',
      icon: 'bi-diagram-3',
      roles: [RolType.AdminCanal, RolType.Vendor]
    },
    {
      id: 'canales',
      label: 'Canales',
      icon: 'bi-grid-3x3-gap',
      roles: [RolType.OficialComercial]
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: 'bi-people-fill',
      roles: [RolType.AdminCanal, RolType.OficialComercial]
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: 'bi-bar-chart',
      roles: [RolType.Vendor, RolType.AdminCanal, RolType.OficialComercial]
    }
  ];

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuarioRol']) {
      this.updateVisibleTabs();
    }
  }

  private updateVisibleTabs(): void {
    // Filtrar tabs basado en el rol del usuario
    this.visibleTabs = this.allTabs.filter(tab => tab.roles.includes(this.usuarioRol));

    // Si no hay tabs visibles o el tab activo no es válido para este rol,
    // seleccionar el primer tab disponible
    if (this.visibleTabs.length > 0 &&
        !this.visibleTabs.some(tab => tab.id === this.activeTab)) {
      this.setActiveTab(this.visibleTabs[0].id);
    }
  }

  setActiveTab(tabId: string): void {
    this.tabChange.emit(tabId);
  }
}
