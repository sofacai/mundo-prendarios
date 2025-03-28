// src/app/core/services/sidebar-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private collapsedSubject = new BehaviorSubject<boolean>(false);
  collapsed$ = this.collapsedSubject.asObservable();

  setCollapsed(isCollapsed: boolean): void {
    this.collapsedSubject.next(isCollapsed);
    // Guardamos la preferencia en localStorage
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }

  getInitialState(): boolean {
    // Recuperar estado guardado
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState === 'true';
  }
}
