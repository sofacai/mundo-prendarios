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

  constructor(private http: HttpClient) {
    // Verificar token al inicio
    this.checkAndRefreshTokenIfNeeded();
  }

  exchangeCodeForToken(code: string, accountDomain?: string): Observable<KommoAuthResponse> {
    console.log(`Enviando: Code=${code}, AccountDomain=${accountDomain}`);

    return this.http.post<KommoAuthResponse>(`${this.apiUrl}/kommo/auth`, {
      Code: code,
      AccountDomain: accountDomain
    }).pipe(
      tap(response => {
        console.log('Respuesta del token:', response);
        this.saveAuthData(response);
      }),
      catchError(error => {
        console.error('Error en intercambio de token:', error);
        return throwError(() => error);
      })
    );
  }

  refreshToken(refreshToken: string): Observable<KommoAuthResponse> {
    return this.http.post<KommoAuthResponse>(`${this.apiUrl}/kommo/refresh`, { refreshToken }).pipe(
      tap(response => {
        console.log('Token refrescado exitosamente');
        this.saveAuthData(response);
      }),
      catchError(error => {
        console.error('Error al refrescar token:', error);
        this.clearAuthData(); // Limpiar datos si falla el refresh
        return throwError(() => error);
      })
    );
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
    console.log('Guardando datos de autenticación de Kommo');

    // Corrige el cálculo de la fecha de expiración
    const now = new Date().getTime();
    const expiresIn = data.expiresIn || 86400; // Valor predeterminado 24 horas
    const expiresAt = now + (expiresIn * 1000);

    const authData = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: expiresIn,
      tokenType: data.tokenType,
      expires_at: expiresAt
    };

    try {
      // Para depurar
      const expiresDate = new Date(expiresAt);
      console.log(`Token expirará: ${expiresDate.toLocaleString()}`);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
      console.log('Datos de autenticación guardados con éxito');
    } catch (error) {
      console.error('Error al guardar datos de autenticación:', error);
    }
  }

  getAuthData(): (KommoAuthResponse & { expires_at: number }) | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error('Error al recuperar datos de autenticación:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const auth = this.getAuthData();
    if (!auth) {
      console.log('No hay datos de autenticación de Kommo');
      return false;
    }

    const now = new Date().getTime();
    const isValid = now < auth.expires_at;

    console.log('Estado de autenticación Kommo:', isValid ? 'Válido' : 'Expirado',
                'Expira en:', new Date(auth.expires_at).toLocaleString());

    return isValid;
  }

  clearAuthData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Método para verificar y refrescar el token si está por expirar
  private checkAndRefreshTokenIfNeeded(): void {
    const auth = this.getAuthData();
    if (!auth) return;

    const now = new Date().getTime();
    const expiresAt = auth.expires_at;

    // Si expira en menos de 5 minutos, refrescar
    const FIVE_MINUTES = 5 * 60 * 1000;
    if (expiresAt - now < FIVE_MINUTES && expiresAt > now) {
      console.log('Token por expirar, refrescando...');
      this.refreshToken(auth.refreshToken).subscribe();
    }
  }
}
