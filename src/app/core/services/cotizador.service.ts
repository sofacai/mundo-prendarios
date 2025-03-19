import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface SubcanalInfo {
  subcanalId: number;
  subcanalNombre: string;
  subcanalActivo: boolean;
  canalId: number;
  gastos: Array<{
    id: number;
    nombre: string;
    porcentaje: number;
  }>;
  planesDisponibles: Array<{
    id: number;
    nombre: string;
    tasa: number;
    montoMinimo: number;
    montoMaximo: number;
    cuotasAplicables: number[];
  }>;
}

export interface DatosWizard {
  subcanales?: SubcanalInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class CotizadorService {
  private apiUrl = 'https://localhost:7136/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getDatosWizard(): Observable<DatosWizard> {
    const headers = this.getAuthHeaders();
    return this.http.get<DatosWizard>(`${this.apiUrl}/VendorInfo/wizard-data`, { headers });
  }

  getPlanesParaCotizar(monto: number, plazo: number, subcanalId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/VendorInfo/planes-cotizar?monto=${monto}&plazo=${plazo}&subcanalId=${subcanalId}`,
      { headers }
    );
  }

  calcularCuota(monto: number, plazo: number, tasa: number, gastos: any[]): number {
    // Suma de porcentajes de gastos
    const porcentajeGastos = gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);

    // Tasa mensual (tasa anual / 12)
    const tasaMensual = tasa / 12 / 100;

    // Cálculo de cuota básica usando fórmula de préstamo
    const cuotaBasica = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazo)) / (Math.pow(1 + tasaMensual, plazo) - 1);

    // Agregar gastos a la cuota
    const cuotaConGastos = cuotaBasica * (1 + porcentajeGastos / 100);

    return Math.round(cuotaConGastos);
  }

  guardarCotizacion(datos: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/VendorInfo/guardar-cotizacion`, datos, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
