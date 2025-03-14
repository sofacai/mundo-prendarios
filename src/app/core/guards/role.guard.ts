import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolType } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url }});
      return false;
    }

    // Verificar si se han especificado roles permitidos
    const allowedRoles = route.data['allowedRoles'] as RolType[];
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    const user = this.authService.currentUserValue;
    if (user && allowedRoles.includes(user.rolId)) {
      return true;
    }

    // Si no tiene los permisos necesarios, redirigir a página de acceso denegado
    this.router.navigate(['/acceso-denegado']);
    return false;
  }
}
