// src/app/pages/canales/components/canal-tabs-navigation/canal-tabs-navigation.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';
import { RolType } from 'src/app/core/models/usuario.model';

interface Tab {
  id: string;
  label: string;
  icon: string;
  requiredRoles?: number[]; // Array of role IDs that can see this tab
}

@Component({
  selector: 'app-canal-tabs-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-tabs-navigation.component.html',
  styleUrls: ['./canal-tabs-navigation.component.scss']
})
export class CanalTabsNavigationComponent implements OnInit {
  @Input() activeTab: string = 'general';
  @Output() tabChange = new EventEmitter<string>();

  tabs: {id: string, label: string, icon: string}[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Base tabs everyone can see
    const baseTabs = [
      { id: 'general', label: 'General', icon: 'bi-info-circle' },
      { id: 'subcanales', label: 'Subcanales', icon: 'bi-diagram-3' },
      { id: 'operaciones', label: 'Operaciones', icon: 'bi-cash' },
      { id: 'vendedores', label: 'Vendedores', icon: 'bi-people' },
      { id: 'estadisticas', label: 'Estadísticas', icon: 'bi-bar-chart' }
    ];

    // Initialize with base tabs
    this.tabs = [...baseTabs];

    // Add admin-only tabs if user is admin
    this.authService.currentUser.subscribe(user => {
      if (user && user.rolId === RolType.Administrador) {
        this.tabs.splice(2, 0, { id: 'planes', label: 'Planes', icon: 'bi-calendar' });
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.tabChange.emit(tabId);
  }
}
