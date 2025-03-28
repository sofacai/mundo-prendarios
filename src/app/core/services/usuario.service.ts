import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface UsuarioDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rolId: number;
  rolNombre: string;
  activo: boolean;
  // New fields
  fechaAlta?: Date;
  fechaUltimaOperacion?: Date;
  cantidadOperaciones: number;
}

export interface UsuarioCrearDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  rolId: number;
  // New field
  fechaAlta?: Date;
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
  private apiUrl = `https://localhost:7136/api/Usuarios`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener todos los usuarios
  getUsuarios(): Observable<UsuarioDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto[]>(this.apiUrl, { headers });
  }

  // Obtener un usuario específico por ID
  getUsuario(id: number): Observable<UsuarioDto> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto>(`${this.apiUrl}/${id}`, { headers });
  }

  // Obtener usuarios por rol (usaremos este para obtener los AdminCanal con rolId=2)
  getUsuariosPorRol(rolId: number): Observable<UsuarioDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/rol/${rolId}`, { headers });
  }

  // Obtener vendedores por subcanal
  getVendorsPorSubcanal(subcanalId: number): Observable<UsuarioDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/vendors/subcanal/${subcanalId}`, { headers });
  }

  // Crear un nuevo usuario
  createUsuario(usuario: UsuarioCrearDto): Observable<UsuarioDto> {
    const headers = this.getAuthHeaders();
    return this.http.post<UsuarioDto>(this.apiUrl, usuario, { headers });
  }

  // Actualizar un usuario existente
  updateUsuario(id: number, usuario: UsuarioCrearDto): Observable<UsuarioDto> {
    const headers = this.getAuthHeaders();
    return this.http.put<UsuarioDto>(`${this.apiUrl}/${id}`, usuario, { headers });
  }

  // Activar un usuario
  activarUsuario(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${id}/activar`, {}, { headers });
  }

  // Desactivar un usuario
  desactivarUsuario(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${id}/desactivar`, {}, { headers });
  }

  // New method to get vendor statistics
  getVendorEstadisticas(id: number): Observable<VendorEstadisticasDto> {
    const headers = this.getAuthHeaders();
    return this.http.get<VendorEstadisticasDto>(`${this.apiUrl}/vendor/estadisticas/${id}`, { headers });
  }

  // Configurar los headers con el token de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
