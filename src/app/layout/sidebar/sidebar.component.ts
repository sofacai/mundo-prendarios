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
  userId: number | null = null;
  isMobile: boolean = false;

  // Dropdown menu
  isCanalesExpanded: boolean = false;

  // Event emitter for sidebar state changes
  @Output() sidebarStateChanged = new EventEmitter<boolean>();

  // Expose RolType for template usage
  rolType = RolType;

  private getUserInfo(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userRole = user.rolId;
      this.userId = user.id;
    }
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarStateService: SidebarStateService
  ) {
    // Subscribe to navigation events to handle menu expansion
    // based on current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Automatically expand Canales menu when route matches
      if (this.isCanalesRelatedRoute(event.url)) {
        this.isCanalesExpanded = true;
      }

      // On mobile devices, collapse sidebar after navigation
      if (this.isMobile && !this.isSidebarCollapsed) {
        this.toggleSidebar();
      }
    });
  }

  ngOnInit(): void {
    // Get user role from authentication service
    this.getUserRole();

    // Subscribe to changes in current user
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userRole = user.rolId;
        this.userId = user.id;
      } else {
        this.userRole = null;
        this.userId = null;
      }
    });

    // Check if we're on mobile
    this.checkScreenSize();

    // Always default to expanded on desktop, collapsed on mobile
    if (this.isMobile) {
      this.isSidebarCollapsed = true;
    } else {
      // On desktop, default to expanded unless explicitly collapsed by user
      this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    }

    // Suscribirse a cambios del servicio
    this.sidebarStateService.collapsed$.subscribe(collapsed => {
      this.isSidebarCollapsed = collapsed;
    });

    // Emit initial state
    this.sidebarStateChanged.emit(this.isSidebarCollapsed);

    // Check current route to expand Canales menu if needed
    if (this.isCanalesRelatedRoute(this.router.url)) {
      this.isCanalesExpanded = true;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const oldIsMobile = this.isMobile;
    this.isMobile = window.innerWidth < 992; // Bootstrap lg breakpoint

    // If we changed from desktop to mobile
    if (!oldIsMobile && this.isMobile) {
      this.isSidebarCollapsed = true;
      this.sidebarStateChanged.emit(this.isSidebarCollapsed);
    }
    // If we changed from mobile to desktop, restore saved preference
    else if (oldIsMobile && !this.isMobile) {
      this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
      this.sidebarStateChanged.emit(this.isSidebarCollapsed);
    }
  }

  /**
   * Toggle sidebar collapsed state - esta es la función que se usa tanto
   * para el botón hamburguesa como para el chevron
   */
  toggleSidebar(): void {
    console.log('toggleSidebar() llamado, isMobile:', this.isMobile);

    // En mobile, cuando está colapsado, lo mostramos
    if (this.isMobile) {
      if (this.isSidebarCollapsed) {
        // Mostrar sidebar
        this.isSidebarCollapsed = false;
        document.body.classList.add('sidebar-open');
      } else {
        // Ocultar sidebar
        this.isSidebarCollapsed = true;
        document.body.classList.remove('sidebar-open');
      }
    } else {
      // En desktop, toggle normal
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    // Notificar cambios al servicio
    this.sidebarStateService.setCollapsed(this.isSidebarCollapsed);

    // Emitir evento
    this.sidebarStateChanged.emit(this.isSidebarCollapsed);

    // En mobile, manipulación directa del DOM
    if (this.isMobile) {
      const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
      if (sidebarElement) {
        sidebarElement.style.transform = this.isSidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)';
      }
    }
  }

  /**
   * Toggle Canales menu expansion
   */
  toggleCanalesMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.isSidebarCollapsed) {
      // In collapsed mode, navigate directly to main page
      this.navigateTo('/canales');
    } else {
      this.isCanalesExpanded = !this.isCanalesExpanded;
    }
  }

  /**
   * Navigate to a route
   */
  navigateTo(route: string): void {
    if (this.isMobile) {
      this.isSidebarCollapsed = true;
      this.sidebarStateChanged.emit(this.isSidebarCollapsed);
      document.body.classList.remove('sidebar-open');

      // Manipulación directa
      const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
      if (sidebarElement) {
        sidebarElement.style.transform = 'translateX(-100%)';
      }
    }

    // Si la ruta es /profile, redirigir a /profile/{userId}
    if (route === '/profile' && this.userId) {
      this.router.navigateByUrl(`/profile/${this.userId}`);
    } else {
      this.router.navigateByUrl(route);
    }
  }


  /**
   * Logout method
   */
  logout(): void {
    this.authService.logout();
  }

  private getUserRole(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userRole = user.rolId;
    }
  }

  /**
   * Check if a route is active
   */
  isActiveRoute(route: string): boolean {
    // Para profile, verificar si está activo cuando estamos en /profile/{userId}
    if (route === '/profile' && this.userId) {
      return this.router.url === `/profile/${this.userId}` ||
             this.router.url.startsWith(`/profile/${this.userId}/`);
    }
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
  /**
   * Check if any Canales menu route is active
   */
  isCanalesMenuActive(): boolean {
    return this.isCanalesRelatedRoute(this.router.url);
  }

  /**
   * Check if the route is related to the Canales menu
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
