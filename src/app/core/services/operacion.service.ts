import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Operacion {
  id?: number;
  monto: number;
  meses: number;
  tasa: number;
  clienteId: number;
  clienteNombre?: string;
  planId: number;
  planNombre?: string;
  vendedorId?: number;
  vendedorNombre?: string;
  subcanalId: number;
  subcanalNombre?: string;
  canalId: number;
  canalNombre?: string;
  fechaCreacion?: Date;
  estado?: string;
  usuarioCreadorId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OperacionService {
  private apiUrl = 'https://localhost:7136/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener todas las operaciones
  getOperaciones(): Observable<Operacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion[]>(`${this.apiUrl}/Operacion`, { headers });
  }

  // Obtener una operación por ID
  getOperacionById(id: number): Observable<Operacion> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion>(`${this.apiUrl}/Operacion/${id}`, { headers });
  }

  // Crear una nueva operación
  crearOperacion(operacion: Operacion): Observable<Operacion> {
    const headers = this.getAuthHeaders();

    // Adapt to the expected API format
    const operacionDto = {
      monto: operacion.monto,
      meses: operacion.meses,
      tasa: operacion.tasa,
      clienteId: operacion.clienteId,
      planId: operacion.planId,
      subcanalId: operacion.subcanalId,
      canalId: operacion.canalId,
      vendedorId: operacion.vendedorId,
      usuarioCreadorId: operacion.usuarioCreadorId,
      estado: operacion.estado || "Ingresada"
    };

    return this.http.post<Operacion>(`${this.apiUrl}/Operacion`, operacionDto, { headers });
  }

  // Crear cliente y operación en una sola llamada
  crearClienteYOperacion(clienteData: any, operacionData: any): Observable<Operacion> {
    const headers = this.getAuthHeaders();

    const combinado = {
      cliente: {
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        cuil: clienteData.cuil || null,
        dni: clienteData.dni || null,
        email: clienteData.email,
        telefono: clienteData.whatsapp || clienteData.telefono,
        provincia: clienteData.provincia || null,
        sexo: clienteData.sexo || null,
        estadoCivil: clienteData.estadoCivil || null
      },
      operacion: {
        monto: operacionData.monto,
        meses: operacionData.meses,
        tasa: operacionData.tasa,
        planId: operacionData.planId,
        subcanalId: operacionData.subcanalId,
        canalId: operacionData.canalId,
        vendedorId: operacionData.vendedorId,
        usuarioCreadorId: operacionData.usuarioCreadorId,
        estado: operacionData.estado || "Ingresada"
      }
    };

    return this.http.post<Operacion>(`${this.apiUrl}/Operacion/cliente`, combinado, { headers });
  }

  // Obtener operaciones de un cliente específico
  getOperacionesPorCliente(clienteId: number): Observable<Operacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion[]>(`${this.apiUrl}/Operacion/cliente/${clienteId}`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
