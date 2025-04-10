import { Component, HostListener, Renderer2 } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { RolType } from './core/models/usuario.model';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule, SidebarComponent]
})
export class AppComponent {
  userRole: RolType | null = null;
  rolType = RolType;
  isInCotizadorPage = false;
  isAuthPage = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2
  ) {
    // Suscribirse a cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Verificar si estamos en una página del cotizador
      this.isInCotizadorPage = event.url.startsWith('/cotizador');

      // Verificar si estamos en una página de autenticación
      this.isAuthPage = event.url.includes('/auth/');

      // Remover clase sidebar-open en páginas de auth
      if (this.isAuthPage) {
        this.renderer.removeClass(document.body, 'sidebar-open');
      }
    });
  }

  ngOnInit() {
    // Verificar la ruta inicial
    this.isInCotizadorPage = this.router.url.startsWith('/cotizador');
    this.isAuthPage = this.router.url.includes('/auth/');

    // Remover clase sidebar-open en carga inicial si es página auth
    if (this.isAuthPage) {
      this.renderer.removeClass(document.body, 'sidebar-open');
    }

    // Suscribirse a los cambios del usuario actual
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userRole = user.rolId;
      } else {
        this.userRole = null;
      }
    });

    this.authService.logoutEvent.subscribe(() => {
      // Cuando se hace logout, establecer isAuthPage a true inmediatamente
      this.isAuthPage = true;
      // Asegurarse de que se remueve la clase
      this.renderer.removeClass(document.body, 'sidebar-open');
      // Resetear el rol de usuario
      this.userRole = null;
    });
  }

  onSidebarStateChanged(isCollapsed: boolean) {
    // Solo aplicar cambios de clase si no estamos en páginas de auth
    if (!this.isAuthPage) {
      if (isCollapsed) {
        this.renderer.removeClass(document.body, 'sidebar-open');
      } else {
        this.renderer.addClass(document.body, 'sidebar-open');
      }
    }
  }

  navigateToCotizador() {
    this.router.navigateByUrl('/cotizador');
  }
}
