import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

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
  private apiUrl = environment.apiUrl;
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


  // Obtener operaciones de un canal específico
  getOperacionesPorCanal(canalId: number): Observable<Operacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion[]>(`${this.apiUrl}/Operacion/canal/${canalId}`, { headers });
  }

  // Contar operaciones liquidadas de un canal específico
  getOperacionesLiquidadasPorCanal(canalId: number): Observable<number> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion[]>(`${this.apiUrl}/Operacion/canal/${canalId}`, { headers })
      .pipe(
        map(operaciones => operaciones.filter(op => op.estado === 'Liquidada').length)
      );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getOperacionesPorSubcanal(subcanalId: number): Observable<Operacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion[]>(`${this.apiUrl}/Operacion/subcanal/${subcanalId}`, { headers });
  }

  // Contar operaciones liquidadas de un subcanal específico
  getOperacionesLiquidadasPorSubcanal(subcanalId: number): Observable<number> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion[]>(`${this.apiUrl}/Operacion/subcanal/${subcanalId}`, { headers })
      .pipe(
        map(operaciones => operaciones.filter(op => op.estado === 'Liquidada').length)
      );
  }

  getOperacionesPorCliente(clienteId: number): Observable<Operacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion[]>(`${this.apiUrl}/Operacion/cliente/${clienteId}`, { headers });
  }

  // Contar operaciones liquidadas de un cliente específico
  getOperacionesLiquidadasPorCliente(clienteId: number): Observable<number> {
    const headers = this.getAuthHeaders();
    return this.http.get<Operacion[]>(`${this.apiUrl}/Operacion/cliente/${clienteId}`, { headers })
      .pipe(
        map(operaciones => operaciones.filter(op => op.estado === 'Liquidada').length)
      );
  }
}
