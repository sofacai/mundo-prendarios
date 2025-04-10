import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni?: string;
  cuil?: string;
  provincia?: string;
  sexo?: string;
  estadoCivil?: string;
  canalId: number;
  canalNombre: string;
  fechaCreacion: Date;
  ultimaModificacion?: Date;
  usuarioCreadorId?: number;
  usuarioCreadorNombre?: string;
  vendoresAsignados?: any[];
  numeroOperaciones: number;

  ingresos?: number;
  auto?: string;
  codigoPostal?: number;
  fechaNacimiento?: string; // o Date si lo convertís después
}

export interface ClienteCrearDto {
  nombre: string;
  apellido: string;
  cuil?: string;
  dni?: string;
  email: string;
  telefono: string;
  provincia?: string;
  sexo?: string;
  estadoCivil?: string;
  canalId?: number;
  autoasignarVendor?: boolean;

  ingresos?: number;
  auto?: string;
  codigoPostal?: number;
  fechaNacimiento?: string;
}


@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = environment.apiUrl;
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

  // Crear un nuevo cliente
  crearCliente(cliente: ClienteCrearDto): Observable<Cliente> {
    const headers = this.getAuthHeaders();
    return this.http.post<Cliente>(`${this.apiUrl}/Clientes`, cliente, { headers });
  }

  // Actualizar un cliente existente
  actualizarCliente(id: number, cliente: ClienteCrearDto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/Clientes/${id}`, cliente, { headers });
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

  // Obtener clientes por canal
  getClientesPorCanal(canalId: number): Observable<Cliente[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Cliente[]>(`${this.apiUrl}/Clientes/canal/${canalId}`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
