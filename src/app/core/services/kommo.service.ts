import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface KommoAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

@Injectable({
  providedIn: 'root'
})
export class KommoService {
  private apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'kommo_auth';

  constructor(private http: HttpClient) { }

  exchangeCodeForToken(code: string, accountDomain?: string): Observable<KommoAuthResponse> {
    // Registrar los valores para depuración
    console.log(`Enviando: Code=${code}, AccountDomain=${accountDomain}`);

    // Asegurarse de que los nombres de propiedades coincidan exactamente con lo que espera el backend
    return this.http.post<KommoAuthResponse>(`${this.apiUrl}/kommo/auth`, {
      Code: code,
      AccountDomain: accountDomain
    }).pipe(
      tap(response => console.log('Respuesta del token:', response)),
      catchError(error => {
        console.error('Error en intercambio de token:', error);
        return throwError(() => error);
      })
    );
  }
  refreshToken(refreshToken: string): Observable<KommoAuthResponse> {
    return this.http.post<KommoAuthResponse>(`${this.apiUrl}/kommo/refresh`, { refreshToken });
  }

  getLeads(): Observable<any> {
    const auth = this.getAuthData();
    if (!auth) {
      throw new Error('No hay token de autenticación disponible');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${auth.accessToken}`
    });

    return this.http.get(`${this.apiUrl}/kommo/leads`, { headers });
  }

  saveAuthData(data: KommoAuthResponse): void {
    const expiresAt = new Date().getTime() + (data.expiresIn * 1000);
    const authData = {
      ...data,
      expires_at: expiresAt
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
  }

  getAuthData(): (KommoAuthResponse & { expires_at: number }) | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  isAuthenticated(): boolean {
    const auth = this.getAuthData();
    if (!auth) return false;

    // Verificar si el token aún es válido (no ha expirado)
    return new Date().getTime() < auth.expires_at;
  }

  clearAuthData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
