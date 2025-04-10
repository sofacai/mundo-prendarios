import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { RolType } from '../models/usuario.model';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface UsuarioDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rolId: number;
  rolNombre: string;
  activo: boolean;
  fechaAlta?: Date;
  fechaUltimaOperacion?: Date;
  cantidadOperaciones: number;
  creadorId?: number;
}

export interface UsuarioCrearDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  rolId: number;
  fechaAlta?: Date;
  creadorId: number;
}

export interface PasswordUpdateDto {
  usuarioId: number;
  password: string;
}

export interface VendorEstadisticasDto {
  id: number;
  nombre: string;
  apellido: string;
  fechaAlta?: Date;
  fechaUltimaOperacion?: Date;
  cantidadOperaciones: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getUsuarios(): Observable<UsuarioDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/usuarios`, { headers })
      .pipe(
        catchError(err => {
          return of([]);
        })
      );
  }

  getUsuario(id: number): Observable<UsuarioDto> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto>(`${this.apiUrl}/usuarios/${id}`, { headers });
  }

  getUsuariosPorCreador(creadorId: number): Observable<UsuarioDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/usuarios/creados-por/${creadorId}`, { headers })
      .pipe(
        catchError(err => {
          return of([]);
        })
      );
  }

  getUsuariosPorRol(rolId: number): Observable<UsuarioDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/usuarios/rol/${rolId}`, { headers });
  }

  getVendorsPorSubcanal(subcanalId: number): Observable<UsuarioDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/usuarios/vendors/subcanal/${subcanalId}`, { headers });
  }

  createUsuario(usuario: UsuarioCrearDto): Observable<UsuarioDto> {
    const headers = this.getAuthHeaders();

    // Asegurar que el creadorId esté configurado
    if (!usuario.creadorId) {
      usuario.creadorId = this.getLoggedInUserId();
    }

    return this.http.post<UsuarioDto>(`${this.apiUrl}/usuarios`, usuario, { headers });
  }

  updateUsuario(id: number, usuario: UsuarioCrearDto): Observable<UsuarioDto> {
    const headers = this.getAuthHeaders();
    return this.http.put<UsuarioDto>(`${this.apiUrl}/usuarios/${id}`, usuario, { headers });
  }

  activarUsuario(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/usuarios/${id}/activar`, {}, { headers });
  }

  desactivarUsuario(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/usuarios/${id}/desactivar`, {}, { headers });
  }

  getVendorEstadisticas(id: number): Observable<VendorEstadisticasDto> {
    const headers = this.getAuthHeaders();
    return this.http.get<VendorEstadisticasDto>(`${this.apiUrl}/usuarios/vendor/estadisticas/${id}`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  updatePassword(usuarioId: number, password: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(
      `${this.apiUrl}/usuarios/${usuarioId}`,
      { password },
      { headers }
    );
  }

  getLoggedInUserId(): number {
    const usuario = this.authService.currentUserValue;
    return usuario ? usuario.id : 0;
  }

  getUsuariosUnificados(): Observable<UsuarioDto[]> {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      return of([]);
    }

    if (currentUser.rolId === RolType.Administrador) {
      return this.getUsuarios();
    }

    return forkJoin({
      asignados: this.getUsuarios().pipe(catchError(() => of([]))),
      creados: this.getUsuariosPorCreador(currentUser.id).pipe(catchError(() => of([])))
    }).pipe(
      map(result => {
        const { asignados, creados } = result;

        // Combinar ambas listas
        const todosUsuarios = [...asignados, ...creados];

        // Eliminar duplicados basándose en ID
        return todosUsuarios.filter((usuario, index, self) =>
          index === self.findIndex((u) => u.id === usuario.id)
        );
      }),
      catchError(() => {
        return of([]);
      })
    );
  }
}
