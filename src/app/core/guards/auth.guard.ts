import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolType } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Verificar si la ruta tiene restricciones de rol
    const roles = route.data['roles'] as RolType[];
    if (roles && roles.length > 0) {
      const user = this.authService.currentUserValue;
      if (!user || !roles.includes(user.rolId)) {
        console.warn(`Acceso denegado a ruta ${state.url}. Usuario con rol ${user?.rolId} intenta acceder a ruta para roles ${roles}`);
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
