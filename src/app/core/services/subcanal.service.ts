// src/app/core/services/subcanal.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface Gasto {
  id: number;
  nombre: string;
  porcentaje: number;
  subcanalId?: number; // Agregamos esta propiedad para la creación
}

export interface Vendor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rolId: number;
  rolNombre: string;
  activo: boolean;
}

export interface Subcanal {
  id: number;
  nombre: string;
  provincia: string;
  localidad: string;
  canalId: number;
  canalNombre: string;
  adminCanalId: number;
  adminCanalNombre: string;
  activo: boolean;
  gastos: Gasto[];
  vendors: Vendor[];
}

export interface SubcanalCrearDto {
  nombre: string;
  provincia: string;
  localidad: string;
  canalId: number;
  adminCanalId: number;  // Agregamos esta propiedad que faltaba
}

@Injectable({
  providedIn: 'root'
})
export class SubcanalService {
  private apiUrl = `https://localhost:7136/api/Subcanal`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener todos los subcanales
  getSubcanales(): Observable<Subcanal[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Subcanal[]>(this.apiUrl, { headers });
  }

  // Obtener un subcanal específico por ID
  getSubcanal(id: number): Observable<Subcanal> {
    const headers = this.getAuthHeaders();
    return this.http.get<Subcanal>(`${this.apiUrl}/${id}`, { headers });
  }

  // Crear un nuevo subcanal
  createSubcanal(subcanal: SubcanalCrearDto): Observable<Subcanal> {
    const headers = this.getAuthHeaders();
    return this.http.post<Subcanal>(this.apiUrl, subcanal, { headers });
  }

  // Actualizar un subcanal existente
  updateSubcanal(id: number, subcanal: SubcanalCrearDto): Observable<Subcanal> {
    const headers = this.getAuthHeaders();
    return this.http.put<Subcanal>(`${this.apiUrl}/${id}`, subcanal, { headers });
  }

  // Activar un subcanal
  activarSubcanal(id: number): Observable<Subcanal> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Subcanal>(`${this.apiUrl}/${id}/activar`, {}, { headers });
  }

  // Desactivar un subcanal
  desactivarSubcanal(id: number): Observable<Subcanal> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Subcanal>(`${this.apiUrl}/${id}/desactivar`, {}, { headers });
  }

  // Agregar un gasto a un subcanal
  agregarGasto(subcanalId: number, gasto: Gasto): Observable<Gasto> {
    const headers = this.getAuthHeaders();
    return this.http.post<Gasto>(`${this.apiUrl}/${subcanalId}/gastos`, gasto, { headers });
  }

  // Eliminar un gasto de un subcanal
  eliminarGasto(gastoId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/gastos/${gastoId}`, { headers });
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
