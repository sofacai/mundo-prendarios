import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { RolType } from 'src/app/core/models/usuario.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userRole: RolType | null = null;
  sidebarCollapsed: boolean = false;

  // Exponer el enum para usarlo en el template
  rolType = RolType;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Obtener el rol del usuario
    const user = this.authService.currentUserValue;
    if (user) {
      this.userRole = user.rolId;
      console.log('Dashboard - Rol del usuario:', this.userRole);
    }

    // Suscribirse a cambios en el usuario actual
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userRole = user.rolId;
        console.log('Dashboard - Actualización del rol:', this.userRole);
      } else {
        this.userRole = null;
      }
    });
  }
}
