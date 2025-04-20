import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
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

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json'
    });

    const leadData = [{
      name: `#${operacion.id || 'Nuevo'} - ${cliente.nombre} ${cliente.apellido}`,
      custom_fields_values: [
        { field_id: 500886, values: [{ value: operacion.id?.toString() || '' }] },
        { field_id: 500892, values: [{ value: parseFloat(operacion.monto) || 0 }] },
        { field_id: 964680, values: [{ value: parseInt(operacion.meses) || 0 }] },
        { field_id: 500996, values: [{ value: parseFloat(operacion.tasa) || 0 }] }
      ],
      tags: [{ name: "Enviar a Banco" }]
    }];

    if (operacion.planNombre) {
      leadData[0].custom_fields_values.push({
        field_id: 962344,
        values: [{ value: operacion.planNombre }]
      });
    }

    console.log('📤 Enviando lead a Kommo:', JSON.stringify(leadData, null, 2));

    return this.http.post(`${this.apiUrl}/kommo/leads`, leadData, { headers }).pipe(
      map((leadResponse: any) => {
        console.log('✅ Lead creado:', leadResponse);
        return leadResponse;
      }),
      catchError(error => {
        console.error('❌ Error al crear lead en Kommo:', error);
        return throwError(() => error);
      })
    );
  }


  private crearContactoSimple(cliente: any, headers: HttpHeaders): Observable<any> {
    const contactoData: any = {
      add: [
        {
          name: `${cliente.nombre} ${cliente.apellido}`,
          custom_fields_values: []
        }
      ]
    };

    // Teléfono (field_code estándar de Kommo)
    if (cliente.telefono || cliente.whatsapp) {
      contactoData.add[0].custom_fields_values.push({
        field_code: "PHONE",
        values: [{ value: cliente.telefono || cliente.whatsapp }]
      });
    }

    // Email (field_code estándar de Kommo)
    if (cliente.email) {
      contactoData.add[0].custom_fields_values.push({
        field_code: "EMAIL",
        values: [{ value: cliente.email }]
      });
    }

    console.log('🧾 Datos de contacto a enviar a Kommo:', JSON.stringify(contactoData, null, 2));

    return this.http.post(`${this.apiUrl}/kommo/contacts`, contactoData, { headers });
  }



  private crearCompaniaSimple(vendedor: any, headers: HttpHeaders): Observable<any> {
    const companyData: any = {
      add: [{
        name: `${vendedor.nombre} ${vendedor.apellido}`,
        custom_fields_values: []
      }]
    };

    // Teléfono
    if (vendedor.telefono) {
      companyData.add[0].custom_fields_values.push({
        field_code: "PHONE",
        values: [{ value: vendedor.telefono }]
      });
    }

    // Email
    if (vendedor.email) {
      companyData.add[0].custom_fields_values.push({
        field_code: "EMAIL",
        values: [{ value: vendedor.email }]
      });
    }

    return this.http.post(`${this.apiUrl}/kommo/companies`, companyData, { headers });
  }

  private vincularContactoALead(contactId: number, leadId: number, headers: HttpHeaders): Observable<any> {
    const linkData = {
      to: [
        {
          to_entity_id: leadId,
          to_entity_type: 'leads'
        }
      ]
    };

    return this.http.post(`${this.apiUrl}/kommo/contacts/${contactId}/link`, linkData, { headers }).pipe(
      tap(response => console.log(`🔗 Contacto ${contactId} vinculado al lead ${leadId}`, response)),
      catchError(error => {
        console.error('❌ Error al vincular contacto con lead:', error);
        return of({ error });
      })
    );
  }

  crearLeadComplejo(payload: any): Observable<any> {
    const auth = this.kommoService.getAuthData();

    if (!auth?.accessToken) {
      console.warn('No hay token de autenticación disponible para Kommo');
      return throwError(() => new Error('No hay token de autenticación disponible'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/kommo/leads`, payload, { headers }).pipe(
      tap(res => console.log('✅ Lead complejo creado:', res)),
      catchError(error => {
        console.error('❌ Error al crear lead complejo:', error);
        return throwError(() => error);
      })
    );
  }




}
