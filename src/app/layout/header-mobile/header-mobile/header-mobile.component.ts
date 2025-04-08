import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RolType } from 'src/app/core/models/usuario.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';

@Component({
  selector: 'app-header-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-mobile.component.html',
  styleUrls: ['./header-mobile.component.scss']
})
export class HeaderMobileComponent implements OnInit {
  userRole: RolType | null = null;
  rolType = RolType;
  isSidebarCollapsed = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarStateService: SidebarStateService
  ) { }

  ngOnInit() {
    this.getUserRole();

    // Suscribirse al estado del sidebar
    this.sidebarStateService.collapsed$.subscribe(collapsed => {
      this.isSidebarCollapsed = collapsed;
    });
  }

  // Esta es la función que llamará el botón hamburguesa
  onToggleSidebar(): void {
    console.log('Hamburger button clicked');

    // Manipulación directa del DOM para solucionar el problema inmediato
    const sidebarElement = document.querySelector('.sidebar') as HTMLElement;
    if (sidebarElement) {
      sidebarElement.style.transform = 'translateX(0)';
      document.body.classList.add('sidebar-open');
    }

    // También intentamos con el servicio
    this.sidebarStateService.setCollapsed(false);
  }

  navigateToCotizador(): void {
    this.router.navigateByUrl('/cotizador');
  }

  private getUserRole(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userRole = user.rolId;
    }
  }
}
