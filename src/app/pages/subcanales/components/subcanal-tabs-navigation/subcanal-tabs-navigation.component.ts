import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subcanal-tabs-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcanal-tabs-navigation.component.html',
  styleUrls: ['./subcanal-tabs-navigation.component.scss']
})
export class SubcanalTabsNavigationComponent {
  @Input() activeTab = 'general';

  @Output() tabSelected = new EventEmitter<string>();

  tabs = [
    { id: 'general', icon: 'bi-info-circle', label: 'General' },
    { id: 'vendedores', icon: 'bi-people', label: 'Vendedores' },
    { id: 'clientes', icon: 'bi-person-lines-fill', label: 'Clientes' },
    { id: 'operaciones', icon: 'bi-cash', label: 'Operaciones' },
    { id: 'gastos', icon: 'bi-calculator', label: 'Gastos' },
    { id: 'estadisticas', icon: 'bi-bar-chart', label: 'Estadísticas' }
  ];

  setActiveTab(tabId: string): void {
    this.tabSelected.emit(tabId);
  }
}
