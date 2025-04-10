import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private collapsedSubject = new BehaviorSubject<boolean>(this.getInitialState());
  collapsed$ = this.collapsedSubject.asObservable();

  constructor(private ngZone: NgZone) {
    // Initialize on service creation
    this.collapsedSubject.next(this.getInitialState());
  }

  setCollapsed(isCollapsed: boolean): void {
    // Ejecutar dentro de NgZone para asegurar detección de cambios
    this.ngZone.run(() => {
      this.collapsedSubject.next(isCollapsed);

      // Guardamos la preferencia en localStorage
      localStorage.setItem('sidebarCollapsed', isCollapsed.toString());

      // Añadir o quitar la clase 'sidebar-open' al body
      if (window.innerWidth < 992) { // En móvil
        if (isCollapsed) {
          document.body.classList.remove('sidebar-open');
        } else {
          document.body.classList.add('sidebar-open');
        }
      }
    });
  }

  getInitialState(): boolean {
    // En móvil, iniciar colapsado
    if (window.innerWidth < 992) {
      return true;
    }

    // Recuperar estado guardado para desktop
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState === 'true';
  }

  // Método para obtener el estado actual sin necesidad de suscribirse
  getCurrentState(): boolean {
    return this.collapsedSubject.getValue();
  }

  // Método específico para el toggle en móvil
  toggleMobileSidebar(): void {
    if (window.innerWidth < 992) {
      // En móvil, siempre expandimos (no colapsamos)
      this.setCollapsed(false);
    }
  }
  toggleCotizadorSidebar(): void {
    this.setCollapsed(false);

    if (window.innerWidth < 992) {
      document.body.classList.add('sidebar-open');

      // Manipulación directa del DOM para garantizar consistencia
      requestAnimationFrame(() => {
        const sidebar = document.querySelector('.sidebar') as HTMLElement;
        if (sidebar) {
          sidebar.style.transform = 'translateX(0)';
          sidebar.style.zIndex = '10000'; // Asegura que esté por encima
        }
      });
    }
  }
}
