import { Component, HostListener } from '@angular/core';
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

    // Suscribirse a los cambios del usuario actual
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userRole = user.rolId;
      } else {
        this.userRole = null;
      }
    });
  }

  navigateToCotizador() {
    this.router.navigateByUrl('/cotizador');
  }
}
