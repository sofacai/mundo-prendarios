import { Component, OnInit, HostListener, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { RolType } from '../../core/models/usuario.model';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  userRole: RolType | null = null;
  isSidebarCollapsed: boolean = false;
  isMobile: boolean = false;

  // Menú desplegable
  isCanalesExpanded: boolean = false;

  // Event emitter for sidebar state changes
  @Output() sidebarStateChanged = new EventEmitter<boolean>();

  // Exponer RolType para usarlo en el template
  rolType = RolType;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarStateService: SidebarStateService

  ) {

    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();

    // Suscribirse a los eventos de navegación para manejar automáticamente
    // la expansión del menú de Canales basado en la ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Expandir automáticamente el menú de Canales cuando la ruta coincide
      if (this.isCanalesRelatedRoute(event.url)) {
        this.isCanalesExpanded = true;
      }

      // En dispositivos móviles, colapsar el sidebar después de la navegación
      if (this.isMobile && !this.isSidebarCollapsed) {
        this.toggleSidebar();
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

    // Cargar la preferencia del sidebar desde localStorage (solo en desktop)
    if (!this.isMobile) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        this.isSidebarCollapsed = savedState === 'true';
        // Emit initial state
        this.sidebarStateChanged.emit(this.isSidebarCollapsed);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const oldIsMobile = this.isMobile;
    this.isMobile = window.innerWidth < 992; // Bootstrap lg breakpoint

    // Si cambiamos de desktop a móvil
    if (!oldIsMobile && this.isMobile) {
      this.isSidebarCollapsed = true;
      this.sidebarStateChanged.emit(this.isSidebarCollapsed);
    }
    // Si cambiamos de móvil a desktop, restaurar preferencia guardada
    else if (oldIsMobile && !this.isMobile) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      this.isSidebarCollapsed = savedState === 'true';
      this.sidebarStateChanged.emit(this.isSidebarCollapsed);
    }
  }

  /**
   * Alterna el estado de colapso del sidebar
   */
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;

    // Notificar a otros componentes
    this.sidebarStateService.setCollapsed(this.isSidebarCollapsed);

    // No es necesario guardar en localStorage aquí, lo hace el servicio
  }

  /**
   * Alterna la expansión del menú de Canales
   */
  toggleCanalesMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.isSidebarCollapsed) {
      // En modo colapsado, navegar directamente a la página principal
      this.navigateTo('/canales');
    } else {
      this.isCanalesExpanded = !this.isCanalesExpanded;
    }
  }

  /**
   * Método para navegar a una ruta
   */
  navigateTo(route: string): void {
    if (this.isMobile) {
      this.isSidebarCollapsed = true;
      this.sidebarStateChanged.emit(this.isSidebarCollapsed);
    }
    this.router.navigateByUrl(route);
  }

  private getUserRole(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userRole = user.rolId;
    }
  }

  /**
   * Verifica si una ruta está activa
   */
  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  /**
   * Verifica si alguna ruta del menú de canales está activa
   */
  isCanalesMenuActive(): boolean {
    return this.isCanalesRelatedRoute(this.router.url);
  }

  /**
   * Verifica si la ruta está relacionada con el menú de Canales
   */
  private isCanalesRelatedRoute(url: string): boolean {
    return url === '/canales' ||
           url.startsWith('/canales/') ||
           url === '/subcanales' ||
           url.startsWith('/subcanales/') ||
           url === '/usuarios' ||
           url.startsWith('/usuarios/');
  }
}
