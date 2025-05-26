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
        console.warn(`Rol desconocido: ${rolName}, usando Vendor como predeterminado`);
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
          console.error('Error en login:', error);
          return throwError(() => new Error('Credenciales incorrectas. Por favor, inténtelo de nuevo.'));
        })
      );
  }
  getUsuarioId(): number {
    const usuario = this.currentUserValue;
    return usuario ? usuario.id : 0;
  }


  isAuthenticated(): boolean {
    return !!this.getToken();
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
      console.error('Error al parsear el usuario del storage:', e);
      return null;
    }

  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.logoutEvent.emit(); // Añadido aquí
    this.router.navigate(['/auth/login']);
  }
}
