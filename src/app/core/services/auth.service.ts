import { EventEmitter, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Usuario, RolType } from '../models/usuario.model';
import { environment } from 'src/environments/environment';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  token: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  public logoutEvent = new EventEmitter<void>();



  constructor() {
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(
      this.getUserFromStorage()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // Función para mapear el nombre del rol al enum RolType
  private mapRolToRolId(rolName: string): RolType {

    switch (rolName) {
      case 'Admin':
        return RolType.Administrador;
      case 'AdminCanal':
        return RolType.AdminCanal;
      case 'Vendor':
        return RolType.Vendor;
      case 'OficialComercial':
          return RolType.OficialComercial;
      default:
        return RolType.Vendor;
    }
  }

  login(credentials: LoginRequest): Observable<Usuario> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/Auth/login`, credentials)
      .pipe(
        map(response => {

          // Crear un objeto Usuario a partir de la respuesta, mapeando el rol a rolId
          const rolId = this.mapRolToRolId(response.rol);

          const usuario: Usuario = {
            id: response.id,
            nombre: response.nombre,
            apellido: response.apellido,
            email: response.email,
            telefono: response.telefono,
            rol: response.rol,
            rolId: rolId,
            token: response.token,
            activo: response.activo ?? true
          };

          return usuario;
        }),
        tap(usuario => {
          if (usuario && usuario.token) {
            localStorage.setItem('token', usuario.token);
            localStorage.setItem('currentUser', JSON.stringify(usuario));
            this.currentUserSubject.next(usuario);
          }
        }),
        catchError(error => {
          return throwError(() => new Error('Credenciales incorrectas. Por favor, inténtelo de nuevo.'));
        })
      );
  }
  getUsuarioId(): number {
    const usuario = this.currentUserValue;
    return usuario ? usuario.id : 0;
  }



  isAdmin(): boolean {
  return this.hasRole(RolType.Administrador);
}

  hasRole(rolId: RolType): boolean {
    const user = this.currentUserValue;
    return user ? user.rolId === rolId : false;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getUserFromStorage(): Usuario | null {
    const userString = localStorage.getItem('currentUser');
    if (!userString) return null;

    try {
      const user = JSON.parse(userString);

      // Si el usuario tiene un rol pero no rolId, mapearlo
      if (user && user.rol && (typeof user.rolId === 'undefined' || isNaN(user.rolId))) {
        user.rolId = this.mapRolToRolId(user.rol);
      }

      return user;
    } catch (e) {
      return null;
    }

  }



  isTokenExpired(): boolean {
  const token = this.getToken();
  if (!token) return true;

  try {
    // Decodificar el JWT para verificar la expiración
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    // Verificar si el token ha expirado (exp está en segundos)
    return payload.exp < currentTime;
  } catch (error) {
    return true; // Si no se puede decodificar, considerarlo expirado
  }
}

// Método mejorado de autenticación que verifica expiración
isAuthenticated(): boolean {
  const hasToken = !!this.getToken();
  const isNotExpired = !this.isTokenExpired();

  // Si hay token pero está expirado, hacer logout automáticamente
  if (hasToken && !isNotExpired) {
    this.logout();
    return false;
  }

  return hasToken && isNotExpired;
}

// Método para validar token antes de cada operación crítica
validateTokenBeforeOperation(): boolean {
  if (!this.isAuthenticated()) {
    this.logout();
    return false;
  }
  return true;
}

// Mejorar el método logout para ser más robusto
logout(): void {

  // Limpiar almacenamiento
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');

  // Actualizar estado
  this.currentUserSubject.next(null);

  // Emitir evento de logout
  this.logoutEvent.emit();

  // Navegar al login solo si no estamos ya ahí
  const currentUrl = this.router.url;
  if (!currentUrl.includes('/auth/login')) {
    this.router.navigate(['/auth/login']);
  }
}

// Método opcional para verificar token periódicamente
startTokenValidation(): void {
  // Verificar cada 30 segundos si el token sigue siendo válido
  setInterval(() => {
    if (this.currentUserValue && this.isTokenExpired()) {
      this.logout();
    }
  }, 30000); // 30 segundos
}
}
