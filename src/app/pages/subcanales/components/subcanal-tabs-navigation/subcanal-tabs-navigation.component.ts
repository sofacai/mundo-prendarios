import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';
import { RolType } from 'src/app/core/models/usuario.model';

interface Tab {
  id: string;
  icon: string;
  label: string;
  requiredRoles?: number[]; // Array de IDs de roles que pueden ver esta pestaña
}

@Component({
  selector: 'app-subcanal-tabs-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcanal-tabs-navigation.component.html',
  styleUrls: ['./subcanal-tabs-navigation.component.scss']
})
export class SubcanalTabsNavigationComponent implements OnInit {
  @Input() activeTab = 'general';
  @Output() tabSelected = new EventEmitter<string>();

  tabs: Tab[] = [];

  // Lista completa de pestañas con sus restricciones de rol
  private allTabs: Tab[] = [
    { id: 'general', icon: 'bi-info-circle', label: 'General' },
    { id: 'vendedores', icon: 'bi-people', label: 'Vendedores' },
    { id: 'operaciones', icon: 'bi-cash', label: 'Operaciones' },
    { id: 'gastos', icon: 'bi-calculator', label: 'Gastos', requiredRoles: [RolType.Administrador] }, // Solo admin
    { id: 'estadisticas', icon: 'bi-bar-chart', label: 'Estadísticas' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Filtrar las pestañas según el rol del usuario
    this.authService.currentUser.subscribe(user => {
      if (user) {
        // Filtrar las pestañas que el usuario puede ver según su rol
        this.tabs = this.allTabs.filter(tab => {
          // Si la pestaña no tiene restricciones, todos pueden verla
          if (!tab.requiredRoles || tab.requiredRoles.length === 0) {
            return true;
          }
          // Si la pestaña tiene restricciones, verificar si el rol del usuario está incluido
          return tab.requiredRoles.includes(user.rolId);
        });
      } else {
        // Si no hay usuario, mostrar solo pestañas sin restricciones
        this.tabs = this.allTabs.filter(tab => !tab.requiredRoles || tab.requiredRoles.length === 0);
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.tabSelected.emit(tabId);
  }
}
