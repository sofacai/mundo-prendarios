import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { RolType } from '../../core/models/usuario.model';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  userRole: RolType | null = null;
  isSidebarCollapsed: boolean = false;
  isMobile: boolean = false;

  // Menú desplegable
  isCanalesExpanded: boolean = false;

  // Exponer RolType para usarlo en el template
  rolType = RolType;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Suscribirse a los eventos de navegación para manejar automáticamente
    // la expansión del menú de Canales basado en la ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Expandir automáticamente el menú de Canales cuando la ruta coincide
      if (this.isCanalesRelatedRoute(event.url)) {
        this.isCanalesExpanded = true;
      }
    });
  }

  ngOnInit(): void {
    // Obtener el rol del usuario desde el servicio de autenticación
    this.getUserRole();

    // Suscribirse a cambios en el usuario actual
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userRole = user.rolId;
        console.log('Sidebar - Actualización del rol:', this.userRole);
      } else {
        this.userRole = null;
      }
    });

    // Comprobar si estamos en móvil al iniciar
    this.checkScreenSize();

    // En móvil, el sidebar comienza colapsado
    this.isSidebarCollapsed = this.isMobile;

    // Verificar la ruta actual para expandir el menú de Canales si es necesario
    if (this.isCanalesRelatedRoute(this.router.url)) {
      this.isCanalesExpanded = true;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 992; // Bootstrap lg breakpoint

    // En desktop siempre mostrar el sidebar, en móvil siempre colapsado por defecto
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    } else if (this.isMobile && this.isSidebarCollapsed === false) {
      // Solo colapsar si está en móvil y está expandido
      this.isSidebarCollapsed = true;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // Método para alternar el menú desplegable de canales
  toggleCanalesMenu(): void {
    this.isCanalesExpanded = !this.isCanalesExpanded;
  }

  // Método mejorado para la navegación
  navigateTo(route: string): void {
    console.log(`Navegando a: ${route}`);
    // Cerrar el sidebar en móvil
    if (this.isMobile) {
      this.isSidebarCollapsed = true;
    }
    // Navegación programática
    this.router.navigate([route]);
  }

  private getUserRole(): void {
    // Obtener el rol del usuario del servicio de autenticación
    const user = this.authService.currentUserValue;
    if (user) {
      this.userRole = user.rolId;
      console.log('Rol del usuario en sidebar:', this.userRole);
    }
  }

  // Método para verificar si una ruta está activa
  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  // Método para verificar si alguna ruta dentro del menú canales está activa
  isCanalesMenuActive(): boolean {
    return this.isCanalesRelatedRoute(this.router.url);
  }

  // Método para verificar si la ruta está relacionada con el menú de Canales
  private isCanalesRelatedRoute(url: string): boolean {
    return url === '/canales' ||
           url === '/subcanales' ||
           url === '/usuarios';
  }
}
