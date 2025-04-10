import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private collapsedSubject = new BehaviorSubject<boolean>(this.getInitialState());
  collapsed$ = this.collapsedSubject.asObservable();
  private overlayElement: HTMLElement | null = null;

  constructor(private ngZone: NgZone) {
    // Initialize on service creation
    this.collapsedSubject.next(this.getInitialState());

    // Crear overlay al iniciar
    this.createOverlay();
  }

  private createOverlay() {
    if (typeof document !== 'undefined') {
      const existingOverlay = document.querySelector('.sidebar-overlay');

      if (!existingOverlay) {
        // Crear el overlay si no existe
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'none';
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '0';

        // Agregar evento click para cerrar el sidebar
        overlay.addEventListener('click', () => {
          this.closeSidebar();
        });

        document.body.appendChild(overlay);
        this.overlayElement = overlay;
      } else {
        this.overlayElement = existingOverlay as HTMLElement;
        // Reemplazar listeners para evitar duplicados
        const newOverlay = this.overlayElement.cloneNode(true);
        this.overlayElement.parentNode?.replaceChild(newOverlay, this.overlayElement);
        this.overlayElement = newOverlay as HTMLElement;
        this.overlayElement.addEventListener('click', () => {
          this.closeSidebar();
        });
      }
    }
  }

  // Método específico para cerrar el sidebar de manera consistente
  private closeSidebar() {
    // Marcar como colapsado en el estado
    this.collapsedSubject.next(true);

    // Guardar en localStorage
    localStorage.setItem('sidebarCollapsed', 'true');

    // Quitar clase del body
    document.body.classList.remove('sidebar-open');

    // Ocultar overlay
    if (this.overlayElement) {
      this.overlayElement.style.opacity = '0';
      setTimeout(() => {
        if (this.overlayElement) {
          this.overlayElement.style.display = 'none';
        }
      }, 300);
    }

    // Restaurar transformación del sidebar igual que hamburguesa
    requestAnimationFrame(() => {
      const sidebar = document.querySelector('.sidebar') as HTMLElement;
      if (sidebar) {
        sidebar.style.transform = 'translateX(-100%)';
      }
    });
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

          // Ocultar overlay
          if (this.overlayElement) {
            this.overlayElement.style.opacity = '0';
            setTimeout(() => {
              if (this.overlayElement) {
                this.overlayElement.style.display = 'none';
              }
            }, 300);
          }

          // Restaurar la transformación del sidebar
          requestAnimationFrame(() => {
            const sidebar = document.querySelector('.sidebar') as HTMLElement;
            if (sidebar) {
              sidebar.style.transform = 'translateX(-100%)';
            }
          });
        } else {
          document.body.classList.add('sidebar-open');

          // Mostrar overlay
          if (this.overlayElement) {
            this.overlayElement.style.display = 'block';
            requestAnimationFrame(() => {
              if (this.overlayElement) {
                this.overlayElement.style.opacity = '1';
              }
            });
          }
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

        // Mostrar overlay
        if (this.overlayElement) {
          this.overlayElement.style.display = 'block';
          requestAnimationFrame(() => {
            if (this.overlayElement) {
              this.overlayElement.style.opacity = '1';
            }
          });
        }
      });
    }
  }
}
