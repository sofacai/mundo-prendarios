import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { KommoService } from './kommo.service';

@Injectable({
  providedIn: 'root'
})
export class KommoLeadService {
  constructor(private kommoService: KommoService) {}

  crearLeadDesdeOperacion(operacion: any, cliente: any): Observable<any> {
    const leadData = [this.buildLeadData(operacion, cliente)];
    return this.kommoService.crearLead(leadData).pipe(
      tap(res => console.log('✅ Lead creado:', res)),
      catchError(error => {
        console.error('❌ Error al crear lead en Kommo:', error);
        return throwError(() => error);
      })
    );
  }

  crearLeadComplejo(payload: any): Observable<any> {
    return this.kommoService.crearLead(payload).pipe(
      tap(res => console.log('✅ Lead complejo creado:', res)),
      catchError(error => {
        console.error('❌ Error al crear lead complejo:', error);
        return throwError(() => error);
      })
    );
  }

  private buildLeadData(operacion: any, cliente: any): any {
    const baseLead = {
      name: `#${operacion.id || 'Nuevo'} - ${cliente.nombre} ${cliente.apellido}`,
      custom_fields_values: [
        { field_id: 500886, values: [{ value: operacion.id?.toString() || '' }] },
        { field_id: 500892, values: [{ value: parseFloat(operacion.monto) || 0 }] },
        { field_id: 964680, values: [{ value: parseInt(operacion.meses) || 0 }] },
        { field_id: 500996, values: [{ value: parseFloat(operacion.tasa) || 0 }] }
      ],
      tags: [{ name: 'Enviar a Banco' }]
    };

    if (operacion.planNombre) {
      baseLead.custom_fields_values.push({
        field_id: 962344,
        values: [{ value: operacion.planNombre }]
      });
    }

    return baseLead;
  }

  linkearContactoALead(contactId: number, leadId: number): Observable<any> {
    const body = {
      to: [
        {
          to_entity_id: leadId,
          to_entity_type: 'leads'
        }
      ]
    };

    return this.kommoService.linkearContactoACompania(contactId, leadId).pipe(
      tap(res => console.log(`🔗 Contacto ${contactId} vinculado al lead ${leadId}`, res)),
      catchError(error => {
        console.error('❌ Error al vincular contacto con lead:', error);
        return of({ error });
      })
    );
  }
}
