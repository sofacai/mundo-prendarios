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

    // Versión simplificada que solo incluye los datos mínimos requeridos
    const lead = [{
      name: `#${operacion.id || 'Nuevo'} - ${cliente.nombre} ${cliente.apellido}`,

      // Campos personalizados de operación - solo los incluimos si tenemos los IDs
      custom_fields_values: [
        {
          field_id: 500886, // ID Operación
          values: [{ value: operacion.id?.toString() || '' }]
        },
        {
          field_id: 500892, // Monto
          values: [{ value: operacion.monto?.toString() || '0' }]
        },
        {
          field_id: 500994, // Meses
          values: [{ value: operacion.meses?.toString() || '0' }]
        },
        {
          field_id: 500996, // Tasa
          values: [{ value: operacion.tasa?.toString() || '0' }]
        }
      ]
    }];

    // Si tenemos más información, la agregamos
    if (operacion.planNombre) {
      lead[0].custom_fields_values.push({
        field_id: 962344, // Plan Nombre
        values: [{ value: operacion.planNombre || '' }]
      });
    }

    if (operacion.vendedorNombre) {
      lead[0].custom_fields_values.push({
        field_id: 501072, // Vendedor Nombre
        values: [{ value: operacion.vendedorNombre || '' }]
      });
    }

    if (operacion.subcanalNombre) {
      lead[0].custom_fields_values.push({
        field_id: 962340, // Subcanal Nombre
        values: [{ value: operacion.subcanalNombre || '' }]
      });
    }

    if (operacion.canalNombre) {
      lead[0].custom_fields_values.push({
        field_id: 962342, // Canal Nombre
        values: [{ value: operacion.canalNombre || '' }]
      });
    }

    if (operacion.vendedorTelefono) {
      lead[0].custom_fields_values.push({
        field_id: 501074, // Teléfono del vendedor
        values: [{ value: operacion.vendedorTelefono || '' }]
      });
    }

    if (operacion.vendedorEmail) {
      lead[0].custom_fields_values.push({
        field_id: 501076, // Email del vendedor
        values: [{ value: operacion.vendedorEmail || '' }]
      });
    }

    console.log('Datos del lead a enviar:', JSON.stringify(lead, null, 2));

    return this.http.post(`${this.apiUrl}/kommo/leads`, lead, { headers }).pipe(
      tap(response => console.log('Lead creado en Kommo:', response)),
      catchError(error => {
        console.error('Error al crear lead en Kommo:', error);
        console.error('Detalles del error:', error.error);
        return throwError(() => error);
      })
    );
  }
}
