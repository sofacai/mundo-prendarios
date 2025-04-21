import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KommoService {
  private readonly kommoApiBase = 'https://mundoprendario.kommo.com/api/v4';
  private readonly longLivedToken = environment.kommoToken;

  constructor(private http: HttpClient) {}

  getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.longLivedToken}`,
      'Content-Type': 'application/json'
    });
  }

  crearContacto(contacto: any[]): Observable<any> {
    return this.http.post(`${this.kommoApiBase}/contacts`, contacto, {
      headers: this.getHeaders()
    });
  }

  crearCompania(compania: any[]): Observable<any> {
    return this.http.post(`${this.kommoApiBase}/companies`, compania, {
      headers: this.getHeaders()
    });
  }

  crearLead(payload: any): Observable<any> {
    return this.http.post(`${this.kommoApiBase}/leads`, payload, {
      headers: this.getHeaders()
    });
  }

  getLeads(): Observable<any> {
    return this.http.get(`${this.kommoApiBase}/leads`, {
      headers: this.getHeaders()
    });
  }

  linkearContactoACompania(contactId: number, companyId: number): Observable<any> {
    const body = {
      to_entity_id: companyId,
      to_entity_type: 'companies'
    };

    return this.http.post(
      `${this.kommoApiBase}/contacts/${contactId}/link`,
      body,
      { headers: this.getHeaders() }
    );
  }

  isAuthenticated(): boolean {
    return !!this.longLivedToken;
  }
}
