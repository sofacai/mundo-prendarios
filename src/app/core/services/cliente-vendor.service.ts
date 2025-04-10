import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Cliente } from './cliente.service';
import { environment } from 'src/environments/environment';

export interface ClienteVendorDto {
  id: number;
  clienteId: number;
  clienteNombre: string;
  clienteApellido: string;
  vendedorId: number;
  vendedorNombre: string;
  fechaAsignacion: string;
}

export interface ClienteVendorCrearDto {
  clienteId: number;
  vendedorId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteVendorService {
  private apiUrl = environment.apiUrl;
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Asignar vendor a cliente
  asignarVendorACliente(clienteId: number, vendedorId: number): Observable<ClienteVendorDto> {
    const headers = this.getAuthHeaders();
    const dto: ClienteVendorCrearDto = {
      clienteId: clienteId,
      vendedorId: vendedorId
    };
    return this.http.post<ClienteVendorDto>(`${this.apiUrl}/ClienteVendors`, dto, { headers });
  }

  // Desasignar vendor de cliente
  desasignarVendorDeCliente(clienteId: number, vendedorId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/ClienteVendors/${clienteId}/vendor/${vendedorId}`, { headers });
  }

  // Obtener vendors asignados a un cliente
  obtenerVendoresPorCliente(clienteId: number): Observable<ClienteVendorDto[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ClienteVendorDto[]>(`${this.apiUrl}/ClienteVendors/cliente/${clienteId}`, { headers });
  }

  // Obtener clientes asignados a un vendor
  obtenerClientesPorVendor(vendorId: number): Observable<Cliente[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Cliente[]>(`${this.apiUrl}/ClienteVendors/vendor/${vendorId}`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
