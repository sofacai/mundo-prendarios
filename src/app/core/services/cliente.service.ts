import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  telefono: string; // Usado como whatsapp
  email: string;
  dni?: string | null; // Cambiado: puede ser null explícitamente
  cuil?: string | null; // Cambiado: puede ser null explícitamente
  provincia?: string;
  sexo?: string;
  estadoCivil?: string;
  fechaCreacion?: Date;
  canalId?: number;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'https://localhost:7136/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener todos los clientes
  getClientes(): Observable<Cliente[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Cliente[]>(`${this.apiUrl}/Clientes`, { headers });
  }

  // Obtener un cliente por ID
  getClienteById(id: number): Observable<Cliente> {
    const headers = this.getAuthHeaders();
    return this.http.get<Cliente>(`${this.apiUrl}/Clientes/${id}`, { headers });
  }

  crearCliente(cliente: any): Observable<Cliente> {
    const headers = this.getAuthHeaders();

    // Aseguramos que los valores null se envíen como string vacía o null explícito
    const clienteData = {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono || cliente.whatsapp,
      email: cliente.email,
      dni: cliente.dni === null ? "" : cliente.dni,
      cuil: cliente.cuil === null ? "" : cliente.cuil,
      canalId: cliente.canalId || 1
    };

    // Corregimos la URL al endpoint correcto
    return this.http.post<Cliente>(`${this.apiUrl}/Clientes`, clienteData, { headers });
  }

  // Actualizar un cliente existente
  actualizarCliente(id: number, cliente: Cliente): Observable<Cliente> {
    const headers = this.getAuthHeaders();

    // Adaptamos el objeto cliente al formato esperado por la API
    const clienteDto = {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      cuil: cliente.cuil || "",
      dni: cliente.dni || "",
      email: cliente.email,
      telefono: cliente.telefono,
      provincia: cliente.provincia || null,
      sexo: cliente.sexo || null,
      estadoCivil: cliente.estadoCivil || null,
      canalId: cliente.canalId || 1
    };

    return this.http.put<Cliente>(`${this.apiUrl}/Clientes/${id}`, clienteDto, { headers });
  }

  // Buscar cliente por DNI
  getClientePorDni(dni: string): Observable<Cliente> {
    const headers = this.getAuthHeaders();
    return this.http.get<Cliente>(`${this.apiUrl}/Clientes/dni/${dni}`, { headers });
  }

  // Buscar cliente por CUIL
  getClientePorCuil(cuil: string): Observable<Cliente> {
    const headers = this.getAuthHeaders();
    return this.http.get<Cliente>(`${this.apiUrl}/Clientes/cuil/${cuil}`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
