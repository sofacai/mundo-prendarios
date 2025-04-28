import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface PlanTasa {
  id: number;
  planId: number;
  plazo: number;
  tasaA: number; // Para autos 0-10 años
  tasaB: number; // Para autos 11-12 años
  tasaC: number; // Para autos 13+ años
  activo: boolean; // Nuevo campo para activar/desactivar plazos
}

export interface PlanTasaCrearDto {
  plazo: number;
  tasaA: number;
  tasaB: number;
  tasaC: number;
  activo: boolean; // Nuevo campo
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
  tasa: number; // Tasa general (legacy)
  gastoOtorgamiento: number; // Antes montoFijo
  banco: string;
  activo: boolean;
  tasas: PlanTasa[]; // Nueva propiedad para las tasas por plazo
}

export interface PlanCrearDto {
  nombre: string;
  fechaInicio: string;
  fechaInicioStr: string;
  fechaFin: string;
  fechaFinStr: string;
  montoMinimo: number;
  montoMaximo: number;
  cuotasAplicables: number[];
  tasa: number;
  gastoOtorgamiento: number;
  banco: string;
  tasas: PlanTasaCrearDto[]; // Tasas al crear el plan
}

export interface TasaCotizacion {
  planId: number;
  plazo: number;
  tasa: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = `${environment.apiUrl}/Plan`;
  private apiUrlTasa = `${environment.apiUrl}/PlanTasa`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // MÉTODOS DE PLANES

  getPlanes(): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan[]>(this.apiUrl, { headers });
  }

  getPlan(id: number): Observable<Plan> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan>(`${this.apiUrl}/${id}`, { headers });
  }

  getPlanesByCanal(canalId: number): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan[]>(`${this.apiUrl}/canal/${canalId}`, { headers });
  }

  getPlanesActivos(): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan[]>(`${this.apiUrl}/activos`, { headers });
  }

  getPlanesRango(monto: number, cuotas: number): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Plan[]>(`${this.apiUrl}/cotizar?monto=${monto}&cuotas=${cuotas}`, { headers });
  }

  createPlan(plan: PlanCrearDto): Observable<Plan> {
    const headers = this.getAuthHeaders();
    return this.http.post<Plan>(this.apiUrl, plan, { headers });
  }

  updatePlan(id: number, plan: PlanCrearDto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}`, plan, { headers });
  }

  activarPlan(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${id}/activar`, {}, { headers });
  }

  desactivarPlan(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${id}/desactivar`, {}, { headers });
  }

  // MÉTODOS PARA PLAN TASA

  getTasasByPlanId(planId: number): Observable<PlanTasa[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PlanTasa[]>(`${this.apiUrlTasa}/plan/${planId}`, { headers });
  }

  // Nuevo método para obtener solo tasas activas
  getTasasActivasByPlanId(planId: number): Observable<PlanTasa[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PlanTasa[]>(`${this.apiUrlTasa}/plan/${planId}/activas`, { headers });
  }

  getTasaByPlanIdAndPlazo(planId: number, plazo: number): Observable<PlanTasa> {
    const headers = this.getAuthHeaders();
    return this.http.get<PlanTasa>(`${this.apiUrlTasa}/plan/${planId}/plazo/${plazo}`, { headers });
  }

  createTasa(planId: number, tasa: PlanTasaCrearDto): Observable<PlanTasa> {
    const headers = this.getAuthHeaders();
    return this.http.post<PlanTasa>(`${this.apiUrlTasa}/plan/${planId}`, tasa, { headers });
  }

  updateTasa(tasaId: number, tasa: PlanTasaCrearDto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrlTasa}/${tasaId}`, tasa, { headers });
  }

  // Nuevos métodos para activar/desactivar tasas
  activarTasa(tasaId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrlTasa}/${tasaId}/activar`, {}, { headers });
  }

  desactivarTasa(tasaId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrlTasa}/${tasaId}/desactivar`, {}, { headers });
  }

  deleteTasa(tasaId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrlTasa}/${tasaId}`, { headers });
  }

  // Método para cotizar tasa según monto, cuotas y antigüedad
  cotizarTasa(monto: number, cuotas: number, antiguedad: number): Observable<TasaCotizacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TasaCotizacion[]>(
      `${this.apiUrlTasa}/cotizar?monto=${monto}&cuotas=${cuotas}&antiguedad=${antiguedad}`,
      { headers }
    );
  }

  // Helpers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Utilidad para obtener plazos válidos disponibles
  getPlazosValidos(): number[] {
    return [12, 18, 24, 30, 36, 48, 60];
  }
}
