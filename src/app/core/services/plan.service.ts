import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

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

export interface PlanCrearDto {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  montoMinimo: number;
  montoMaximo: number;
  cuotasAplicables: number[];
  tasa: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = `${environment.apiUrl}/Plan`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener todos los planes
  getPlanes(): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan[]>(this.apiUrl, { headers });
  }

  // Obtener un plan específico por ID
  getPlan(id: number): Observable<Plan> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan>(`${this.apiUrl}/${id}`, { headers });
  }

  // Obtener planes por canal
  getPlanesByCanal(canalId: number): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan[]>(`${this.apiUrl}/canal/${canalId}`, { headers });
  }

  // Obtener planes activos
  getPlanesActivos(): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan[]>(`${this.apiUrl}/activos`, { headers });
  }

  // Obtener planes por rango y cuotas
  getPlanesRango(monto: number, cuotas: number): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan[]>(`${this.apiUrl}/cotizar?monto=${monto}&cuotas=${cuotas}`, { headers });
  }

  // Crear un nuevo plan
  createPlan(plan: PlanCrearDto): Observable<Plan> {
    const headers = this.getAuthHeaders();
    return this.http.post<Plan>(this.apiUrl, plan, { headers });
  }

  // Actualizar un plan existente
  updatePlan(id: number, plan: PlanCrearDto): Observable<Plan> {
    const headers = this.getAuthHeaders();
    return this.http.put<Plan>(`${this.apiUrl}/${id}`, plan, { headers });
  }

  // Activar un plan
  activarPlan(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${id}/activar`, {}, { headers });
  }

  // Desactivar un plan
  desactivarPlan(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${id}/desactivar`, {}, { headers });
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
