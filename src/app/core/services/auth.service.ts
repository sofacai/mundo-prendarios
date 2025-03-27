import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Usuario, RolType } from '../models/usuario.model';

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
  private apiUrl = 'https://localhost:7136/api';
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(
      this.getUserFromStorage()
    );
    this.currentUser = this.currentUserSubject.asObservable();
    console.log('AuthService - Usuario inicial:', this.currentUserSubject.value);
  }

  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // Función para mapear el nombre del rol al enum RolType
  private mapRolToRolId(rolName: string): RolType {
    console.log('Mapeando rol:', rolName);

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
          console.log('Respuesta original del login:', response);

          // Crear un objeto Usuario a partir de la respuesta, mapeando el rol a rolId
          const rolId = this.mapRolToRolId(response.rol);
          console.log(`Rol "${response.rol}" mapeado a rolId: ${rolId}`);

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

          console.log('Usuario procesado:', usuario);
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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
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
      console.log('Usuario recuperado del storage:', user);

      // Si el usuario tiene un rol pero no rolId, mapearlo
      if (user && user.rol && (typeof user.rolId === 'undefined' || isNaN(user.rolId))) {
        user.rolId = this.mapRolToRolId(user.rol);
        console.log(`Rol "${user.rol}" mapeado a rolId: ${user.rolId} (desde storage)`);
      }

      return user;
    } catch (e) {
      console.error('Error al parsear el usuario del storage:', e);
      return null;
    }
  }
}
