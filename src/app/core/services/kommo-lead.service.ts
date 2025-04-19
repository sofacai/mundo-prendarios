import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { KommoService } from './kommo.service';

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
   * Versión simplificada para la API estándar
   */
  crearLeadDesdeOperacion(operacion: any, cliente: any): Observable<any> {
    const auth = this.kommoService.getAuthData();

    if (!auth?.accessToken) {
      console.warn('No hay token de autenticación disponible para Kommo');
      return throwError(() => new Error('No hay token de autenticación disponible'));
    }

    // Crear los headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json'
    });

    // Estructura muy básica del lead para la API estándar de Kommo
    const leadData = [{
      name: `#${operacion.id || 'Nuevo'} - ${cliente.nombre} ${cliente.apellido}`,

      // Campos personalizados básicos de operación
      custom_fields_values: [
        // ID Operación
        {
          field_id: 500886,
          values: [{ value: operacion.id?.toString() || '' }]
        },
        // Monto
        {
          field_id: 500892,
          values: [{ value: operacion.monto?.toString() || '0' }]
        },
        // Meses
        {
          field_id: 500994,
          values: [{ value: operacion.meses?.toString() || '0' }]
        },
        // Tasa
        {
          field_id: 500996,
          values: [{ value: operacion.tasa?.toString() || '0' }]
        }
      ]
    }];

    // Añadir plan si existe
    if (operacion.planNombre) {
      leadData[0].custom_fields_values.push({
        field_id: 962344, // Plan Nombre
        values: [{ value: operacion.planNombre || '' }]
      });
    }

    console.log('Datos básicos del lead a enviar:', JSON.stringify(leadData, null, 2));

    return this.http.post(`${this.apiUrl}/kommo/leads`, leadData, { headers }).pipe(
      tap(response => console.log('Lead creado en Kommo:', response)),
      catchError(error => {
        console.error('Error al crear lead en Kommo:', error);
        console.error('Detalles del error:', error.error);
        return throwError(() => error);
      })
    );
  }
}
