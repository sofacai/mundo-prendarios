import { Component, HostListener } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { RolType } from './core/models/usuario.model';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderMobileComponent } from './layout/header-mobile/header-mobile/header-mobile.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule, SidebarComponent, HeaderMobileComponent]
})
export class AppComponent {
  userRole: RolType | null = null;
  rolType = RolType;
  isInCotizadorPage = false;
  isMobile = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Suscribirse a cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Verificar si estamos en una página del cotizador
      this.isInCotizadorPage = event.url.startsWith('/cotizador');
    });
  }

  ngOnInit() {
    // Verificar la ruta inicial
    this.isInCotizadorPage = this.router.url.startsWith('/cotizador');

    // Verificar el tamaño de pantalla inicial
    this.checkScreenSize();

    // Suscribirse a los cambios del usuario actual
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userRole = user.rolId;
      } else {
        this.userRole = null;
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 992; // Bootstrap lg breakpoint
  }

  navigateToCotizador() {
    this.router.navigateByUrl('/cotizador');
  }
}
