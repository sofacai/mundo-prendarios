import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface Gasto {
  id: number;
  nombre: string;
  porcentaje: number;
}

export interface Subcanal {
  id: number;
  nombre: string;
  provincia: string;
  localidad: string;
  activo: boolean;
  gastos: Gasto[];
}

export interface Plan {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaInicioStr: string;
  fechaFin: string;
  fechaFinStr: string;
  montoMinimo: number;
  montoMaximo: number;
  cuotasAplicables: string;
  cuotasAplicablesList: number[];
  tasa: number;
  montoFijo: number;
  activo: boolean;
}

export interface PlanCanal {
  id: number;
  planId: number;
  canalId: number;
  activo: boolean;
  plan: Plan;
}

export interface OficialComercialResumen {
  id: number;
  nombre: string;
  apellido: string;
  fechaAsignacion: string;
}

export interface Canal {
  id: number;
  nombreFantasia: string;
  razonSocial: string;
  provincia: string;
  localidad: string;
  cuit: string;
  cbu: string;
  alias: string;
  banco: string;
  numCuenta: string;
  tipoCanal: string;
  activo: boolean;
  subcanales: Subcanal[];
  planesCanal: PlanCanal[];
  // Nuevos campos
  direccion?: string;
  fechaAlta?: string;
  opcionesCobro?: string;
  foto?: string;
  titularNombreCompleto?: string;
  titularTelefono?: string;
  titularEmail?: string;
  oficialesComerciales?: any[];
  numeroOperaciones?: number;
}

export interface CanalCrearDto {
  nombreFantasia: string;
  razonSocial: string;
  provincia: string;
  localidad: string;
  cuit: string;
  cbu: string;
  alias: string;
  banco: string;
  numCuenta: string;
  tipoCanal: string;
  activo: boolean;
  // Nuevos campos
  direccion?: string;
  opcionesCobro?: string;
  foto?: string;
  titularNombreCompleto?: string;
  titularTelefono?: string;
  titularEmail?: string;
  oficialesComerciales?: number[];
}

export interface PlanCanalCrearDto {
  planId: number;
}

export interface CanalOficialComercialCrearDto {
  canalId: number;
  oficialComercialId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CanalService {
  private apiUrl = `https://localhost:7136/api/Canal`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener todos los canales
  getCanales(): Observable<Canal[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Canal[]>(this.apiUrl, { headers });
  }

  // Obtener un canal específico por ID
  getCanal(id: number): Observable<Canal> {
    const headers = this.getAuthHeaders();
    return this.http.get<Canal>(`${this.apiUrl}/${id}`, { headers });
  }

  // Obtener detalles completos de un canal
  getCanalDetalles(id: number): Observable<Canal> {
    const headers = this.getAuthHeaders();
    return this.http.get<Canal>(`${this.apiUrl}/${id}/detalles`, { headers });
  }

  // Crear un nuevo canal
  createCanal(canal: CanalCrearDto): Observable<Canal> {
    const headers = this.getAuthHeaders();
    return this.http.post<Canal>(this.apiUrl, canal, { headers });
  }

  // Actualizar un canal existente
  updateCanal(id: number, canal: CanalCrearDto): Observable<Canal> {
    const headers = this.getAuthHeaders();
    return this.http.put<Canal>(`${this.apiUrl}/${id}`, canal, { headers });
  }

  // Activar un canal
  activarCanal(id: number): Observable<Canal> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Canal>(`${this.apiUrl}/${id}/activar`, {}, { headers });
  }

  // Desactivar un canal
  desactivarCanal(id: number): Observable<Canal> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Canal>(`${this.apiUrl}/${id}/desactivar`, {}, { headers });
  }

  // Asignar un plan a un canal
  asignarPlanACanal(canalId: number, planId: number): Observable<PlanCanal> {
    const headers = this.getAuthHeaders();
    return this.http.post<PlanCanal>(`${this.apiUrl}/${canalId}/plan/${planId}`, {}, { headers });
  }

  // Obtener planes de un canal
  getPlanesCanal(canalId: number): Observable<PlanCanal[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PlanCanal[]>(`${this.apiUrl}/${canalId}/planes`, { headers });
  }

  // Activar un plan para un canal
  activarPlanCanal(planCanalId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/planes/${planCanalId}/activar`, {}, { headers });
  }

  // Desactivar un plan para un canal
  desactivarPlanCanal(planCanalId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/planes/${planCanalId}/desactivar`, {}, { headers });
  }

  // Eliminar un plan de un canal
  eliminarPlanCanal(planCanalId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/planes/${planCanalId}`, { headers });
  }

  // Asignar un oficial comercial a un canal
  asignarOficialComercialACanal(canalId: number, oficialComercialId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/${canalId}/oficialcomercial/${oficialComercialId}`, {}, { headers });
  }

  // Obtener oficiales comerciales de un canal
  getOficialesComercialCanal(canalId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/${canalId}`, { headers });
  }

  // Desasignar un oficial comercial de un canal
  desasignarOficialComercialDeCanal(canalId: number, oficialComercialId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${canalId}/oficialcomercial/${oficialComercialId}`, { headers });
  }

  // Configurar los headers con el token de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Añadir al final de CanalService antes del cierre de la clase
uploadCanalImage(formData: FormData): Observable<{imageUrl: string}> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.post<{imageUrl: string}>(`${this.apiUrl}/upload-image`, formData, { headers });
}
}
