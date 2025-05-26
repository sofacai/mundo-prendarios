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
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isInCotizadorPage = event.url.startsWith('/cotizador');
      this.isAuthPage = event.url.includes('/auth/');

      if (this.isAuthPage) {
        this.renderer.removeClass(document.body, 'sidebar-open');
      }
    });
  }

  ngOnInit() {
    this.isInCotizadorPage = this.router.url.startsWith('/cotizador');
    this.isAuthPage = this.router.url.includes('/auth/');

    if (this.isAuthPage) {
      this.renderer.removeClass(document.body, 'sidebar-open');
    }

    // Verificar token al iniciar la aplicación
    if (!this.isAuthPage && !this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
    }

    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userRole = user.rolId;
        // Iniciar validación periódica de token solo si hay usuario logueado
        this.authService.startTokenValidation();
      } else {
        this.userRole = null;
      }
    });

    this.authService.logoutEvent.subscribe(() => {
      this.isAuthPage = true;
      this.renderer.removeClass(document.body, 'sidebar-open');
      this.userRole = null;
    });
  }

  onSidebarStateChanged(isCollapsed: boolean) {
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
