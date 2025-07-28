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

  // Campos existentes
  montoAprobado?: number;
  montoAprobadoBanco?: number;
  mesesAprobados?: number;
  tasaAprobada?: number;
  planAprobadoId?: number;
  planAprobadoNombre?: string;
  fechaAprobacion?: Date;
  liquidada?: boolean;
  fechaLiquidacion?: Date;
  cuotaInicial?: number;
  cuotaInicialAprobada?: number;
  cuotaPromedio?: number;
  cuotaPromedioAprobada?: number;
  autoInicial?: string;
  autoAprobado?: string;
  urlAprobadoDefinitivo?: string;
  observaciones?: string;

  // *** NUEVOS CAMPOS AGREGADOS ***
  gastoInicial?: number;
  gastoAprobado?: number;
  bancoInicial?: string;
  bancoAprobado?: string;
  estadoDashboard?: string;
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
      estado: operacion.estado || "Ingresada",
      // Incluir todos los campos adicionales
      cuotaInicial: operacion.cuotaInicial,
      cuotaPromedio: operacion.cuotaPromedio,
      autoInicial: operacion.autoInicial,
      observaciones: operacion.observaciones,
      urlAprobadoDefinitivo: operacion.urlAprobadoDefinitivo,
         gastoInicial: operacion.gastoInicial,
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
        estado: operacionData.estado || "Ingresada",
        // Incluir todos los campos adicionales
        cuotaInicial: operacionData.cuotaInicial,
        cuotaPromedio: operacionData.cuotaPromedio,
        autoInicial: operacionData.autoInicial,
        observaciones: operacionData.observaciones,
        urlAprobadoDefinitivo: operacionData.urlAprobadoDefinitivo,
         gastoInicial: operacionData.gastoInicial
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
        map(operaciones => operaciones.filter(op => op.estadoDashboard === 'LIQUIDADA').length)
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
        map(operaciones => operaciones.filter(op => op.estadoDashboard === 'LIQUIDADA').length)
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
        map(operaciones => operaciones.filter(op => op.estadoDashboard === 'LIQUIDADA').length)
      );
  }

  getEstadoColor(estado: string): string {
    const estadoLower = estado?.toLowerCase() || '';

    switch (estadoLower) {
      // Estados nuevos con colores específicos
      case 'enviada mp':
        return 'rgb(173, 216, 230)'; // Celeste
      case 'aprobado def':
        return 'rgb(144, 205, 176)'; // Verde claro
      case 'aprobado prov.':
        return 'rgb(186, 85, 211)'; // Violeta
      case 'confec. prenda':
        return 'rgb(255, 223, 0)'; // Amarillo
      case 'en proc. liq.':
        return 'rgb(255, 165, 0)'; // Naranja
      case 'liquidado':
        return 'rgb(34, 139, 34)'; // Verde
      case 'rechazado':
        return 'rgb(220, 20, 60)'; // Rojo

      // Estados heredados
      case 'en gestion':
        return 'rgb(134, 192, 252)'; // Azul claro
      case 'propuesta':
        return 'rgb(134, 192, 252)'; // Azul claro
      case 'ingresada':
        return 'rgb(134, 192, 252)'; // Azul claro

      // Estados legacy (mantener compatibilidad)
      case 'liquidada':
        return 'rgb(34, 139, 34)'; // Verde (mapea a liquidado)
      case 'firmar docum':
        return 'rgb(255, 223, 0)'; // Amarillo (mapea a confec. prenda)
      case 'completando docu':
        return 'rgb(255, 223, 0)'; // Amarillo (mapea a confec. prenda)
      case 'en analisis':
        return 'rgb(173, 216, 230)'; // Celeste (mapea a enviada mp)
      case 'analisis bco':
        return 'rgb(173, 216, 230)'; // Celeste (mapea a enviada mp)
      case 'enviada':
        return 'rgb(173, 216, 230)'; // Celeste (mapea a enviada mp)
      case 'en proc.insc.':
        return 'rgb(255, 223, 0)'; // Amarillo (mapea a confec. prenda)
      case 'en proc.liq.':
        return 'rgb(255, 165, 0)'; // Naranja

      default:
        return 'rgb(222, 226, 230)'; // Gris por defecto
    }
  }

  getEstadoClass(estado: string): string {
    const estadoLower = estado?.toLowerCase()?.trim() || '';

    // Para los nuevos estados
    switch (estadoLower) {
      // Estados nuevos
      case 'enviada mp':
        return 'badge-estado-enviada-mp'; // Celeste
      case 'aprobado def':
        return 'badge-estado-aprobado-def'; // Verde claro
      case 'aprobado prov.':
        return 'badge-estado-aprobado-prov'; // Violeta
      case 'confec. prenda':
        return 'badge-estado-confec-prenda'; // Amarillo
      case 'en proc. liq.':
        return 'badge-estado-en-proc-liq'; // Naranja
      case 'liquidado':
        return 'badge-estado-liquidado'; // Verde
      case 'rechazado':
        return 'badge-estado-rechazado'; // Rojo

      // Estados heredados
      case 'en gestion':
        return 'badge-estado-en-gestion'; // Azul claro
      case 'propuesta':
        return 'badge-estado-propuesta'; // Azul claro
      case 'ingresada':
        return 'badge-estado-ingresada'; // Azul claro

      // Estados legacy (compatibilidad hacia atrás)
      case 'liquidada':
        return 'badge-estado-liquidado'; // Mapea a liquidado
      case 'firmar docum':
        return 'badge-estado-confec-prenda'; // Mapea a confec. prenda
      case 'completando docu':
        return 'badge-estado-confec-prenda'; // Mapea a confec. prenda
      case 'en analisis':
        return 'badge-estado-enviada-mp'; // Mapea a enviada mp
      case 'analisis bco':
        return 'badge-estado-enviada-mp'; // Mapea a enviada mp
      case 'enviada':
        return 'badge-estado-enviada-mp'; // Mapea a enviada mp
      case 'en proc.insc.':
        return 'badge-estado-confec-prenda'; // Mapea a confec. prenda

      // Fallback para apto credito (regex)
      default:
        if (/apto\s*cr[eé]dito/.test(estadoLower)) {
          return 'badge-estado-aprobado-def';
        }
        return 'badge-light'; // Estado no reconocido
    }
  }

  eliminarOperacion(id: number): Observable<any> {
  const headers = this.getAuthHeaders();
  return this.http.delete(`${this.apiUrl}/Operacion/${id}`, { headers });
}

  // Actualizar fecha de aprobación
  actualizarFechaAprobacion(id: number, fechaAprobacion: Date | null): Observable<Operacion> {
    const headers = this.getAuthHeaders();
    const body = {
      fechaAprobacion: fechaAprobacion
    };
    return this.http.patch<Operacion>(`${this.apiUrl}/Operacion/${id}/fecha-aprobacion`, body, { headers });
  }

  // Actualizar fecha de liquidación
  actualizarFechaLiquidacion(id: number, fechaLiquidacion: Date | null): Observable<Operacion> {
    const headers = this.getAuthHeaders();
    const body = {
      fechaLiquidacion: fechaLiquidacion
    };
    return this.http.patch<Operacion>(`${this.apiUrl}/Operacion/${id}/fecha-liquidacion`, body, { headers });
  }
}
