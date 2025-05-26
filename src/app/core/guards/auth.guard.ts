import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolType } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Verificar autenticación incluyendo expiración de token
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Verificar roles si están definidos en la ruta
    const requiredRoles = route.data?.['roles'] as RolType[];
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = this.authService.currentUserValue?.rolId;

      if (!userRole || !requiredRoles.includes(userRole)) {
        this.router.navigate(['/dashboard']); // o a una página de acceso denegado
        return false;
      }
    }

    return true;
  }
}
