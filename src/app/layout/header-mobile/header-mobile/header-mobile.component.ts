import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RolType } from 'src/app/core/models/usuario.model';
import { AuthService } from 'src/app/core/services/auth.service';


@Component({
  selector: 'app-header-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-mobile.component.html',
  styleUrls: ['./header-mobile.component.scss']
})
export class HeaderMobileComponent {
  userRole: RolType | null = null;
  rolType = RolType;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.getUserRole();
  }

  toggleSidebar(): void {
    // Obtener referencia al sidebar
    const sidebarComp = document.querySelector('app-sidebar');

    // Simular clic en el botón toggle
    const toggleButton = sidebarComp?.querySelector('.toggle-btn');
    if (toggleButton) {
      (toggleButton as HTMLElement).click();
    }
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
