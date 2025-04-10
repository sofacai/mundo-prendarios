import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Gasto, GastoCreate, GastoUpdate } from '../models/gasto.model';
import { environment } from 'src/environments/environment';

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
  comision: number;
  vendors: Vendor[];
  numeroOperaciones?: number;
  gastos: Gasto[];
}

export interface SubcanalCrearDto {
  nombre: string;
  provincia: string;
  localidad: string;
  canalId: number;
  adminCanalId?: number;
  comision: number;
}

// Interfaz para actualizar la comisión
export interface ComisionActualizarDto {
  comision: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubcanalService {
  private apiUrl = `${environment.apiUrl}/Subcanal`;
  subcanalService: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {  }

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

  // Obtener subcanales por usuario
  getSubcanalesPorUsuario(usuarioId: number): Observable<Subcanal[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Subcanal[]>(`${this.apiUrl}/usuario/${usuarioId}`, { headers });
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

  asignarVendorASubcanal(subcanalId: number, vendorId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/${subcanalId}/vendor/${vendorId}`, {}, { headers });
  }

  desasignarVendorDeSubcanal(subcanalId: number, vendorId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${subcanalId}/vendor/${vendorId}`, { headers });
  }

  // Desactivar un subcanal
  desactivarSubcanal(id: number): Observable<Subcanal> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Subcanal>(`${this.apiUrl}/${id}/desactivar`, {}, { headers });
  }

  // Agregar un gasto a un subcanal
  agregarGasto(subcanalId: number, gasto: GastoCreate): Observable<Gasto> {
    const headers = this.getAuthHeaders();
    // Asegurar que el subcanalId esté siempre establecido en el cuerpo
    const gastoData: GastoCreate = {
      ...gasto,
      subcanalId: subcanalId
    };
    return this.http.post<Gasto>(`${this.apiUrl}/gasto`, gastoData, { headers });
  }

  // Eliminar un gasto de un subcanal
  eliminarGasto(gastoId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/gasto/${gastoId}`, { headers });
  }

  // Actualizar un gasto existente
  updateGasto(gastoId: number, gasto: GastoUpdate): Observable<Gasto> {
    const headers = this.getAuthHeaders();
    return this.http.put<Gasto>(`${this.apiUrl}/gasto/${gastoId}`, gasto, { headers });
  }

  // Nuevo método para actualizar la comisión
  actualizarComision(subcanalId: number, comision: ComisionActualizarDto): Observable<Subcanal> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Subcanal>(`${this.apiUrl}/${subcanalId}/comision`, comision, { headers });
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
