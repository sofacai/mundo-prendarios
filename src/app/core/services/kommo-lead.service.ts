import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { KommoService } from './kommo.service';

export interface KommoLead {
  name: string;
  price: number;
  status_id: number;
  pipeline_id: number;
  custom_fields_values?: Array<{
    field_id: number;
    values: Array<{
      value: string | number;
    }>;
  }>;
  _embedded?: {
    contacts?: Array<{
      id?: number;
      name?: string;
      first_name?: string;
      last_name?: string;
      custom_fields_values?: Array<{
        field_id: number;
        values: Array<{
          value: string | number;
        }>;
      }>;
    }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class KommoLeadService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private kommoService: KommoService
  ) { }

  /**
   * Crea un lead en Kommo basado en una operación de Mundo Prendario
   */
  crearLeadDesdeOperacion(operacion: any, cliente: any): Observable<any> {
    const auth = this.kommoService.getAuthData();

    if (!auth?.accessToken) {
      console.warn('No hay token de autenticación disponible para Kommo');
      return throwError(() => new Error('No hay token de autenticación disponible'));
    }

    // Crear los headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${auth.accessToken}`
    });

    // Construir el lead para Kommo según API - IMPORTANTE: debe ser un array
    const lead = [{
      name: `Préstamo prendario - ${cliente.nombre} ${cliente.apellido}`,
      price: operacion.monto,
      status_id: 37724990,
      pipeline_id: 5481486,
      custom_fields_values: [
        {
          field_id: 949669,
          values: [{ value: operacion.monto }]
        },
        {
          field_id: 949671,
          values: [{ value: operacion.meses }]
        },
        {
          field_id: 949673,
          values: [{ value: operacion.tasa }]
        }
      ],
      _embedded: {
        contacts: [
          {
            first_name: cliente.nombre,
            last_name: cliente.apellido,
            custom_fields_values: [
              {
                field_id: 728317,
                values: [{ value: cliente.email || '' }]
              },
              {
                field_id: 728319,
                values: [{ value: cliente.telefono || '' }]
              },
              {
                field_id: 728321,
                values: [{ value: cliente.dni || '' }]
              }
            ]
          }
        ]
      }
    }];

    return this.http.post(`${this.apiUrl}/kommo/leads`, lead, { headers }).pipe(
      tap(response => console.log('Lead creado en Kommo:', response)),
      catchError(error => {
        console.error('Error al crear lead en Kommo:', error);
        return throwError(() => error);
      })
    );
  }
}
