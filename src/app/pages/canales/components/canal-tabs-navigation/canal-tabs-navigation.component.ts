// Archivo: src/app/pages/canales/components/canal-tabs-navigation/canal-tabs-navigation.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-canal-tabs-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-tabs-navigation.component.html',
  styleUrls: ['./canal-tabs-navigation.component.scss']
})
export class CanalTabsNavigationComponent {
  @Input() activeTab: string = 'general';
  @Output() tabChange = new EventEmitter<string>();

  tabs = [
    { id: 'general', label: 'General', icon: 'bi-info-circle' },
    { id: 'subcanales', label: 'Subcanales', icon: 'bi-diagram-3' },
    { id: 'planes', label: 'Planes', icon: 'bi-calendar' },
    { id: 'operaciones', label: 'Operaciones', icon: 'bi-cash' },
    { id: 'vendedores', label: 'Vendedores', icon: 'bi-people' },
    { id: 'estadisticas', label: 'Estadísticas', icon: 'bi-bar-chart' }
  ];

  constructor() { }

  setActiveTab(tabId: string): void {
    this.tabChange.emit(tabId);
  }
}
