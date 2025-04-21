import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KommoService {
  private readonly apiBase = `${environment.apiUrl}/kommo`;

  constructor(private http: HttpClient) {}

  crearContacto(contactos: any[]): Observable<any> {
    return this.http.post(`${this.apiBase}/contacts`, contactos);
  }

  crearCompania(companias: any[]): Observable<any> {
    return this.http.post(`${this.apiBase}/companies`, companias);
  }

  crearLead(payload: any): Observable<any> {
    return this.http.post(`${this.apiBase}/leads`, payload);
  }

  linkearContactoACompania(contactId: number, companyId: number): Observable<any> {
    return this.http.post(`${this.apiBase}/contacts/${contactId}/link`, {
      companyId
    });
  }

  isAuthenticated(): boolean {
    return true; // si el token ya está en el backend, no hace falta validarlo acá
  }
}
