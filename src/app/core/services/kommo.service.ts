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
    console.log(`Intercambiando código por token: ${code}, dominio: ${accountDomain}`);

    return this.http.post<any>(`${this.apiUrl}/kommo/auth`, {
      Code: code,
      AccountDomain: accountDomain
    }).pipe(
      tap(response => {
        console.log('Respuesta original:', response);

        // Crear un objeto con el formato correcto
        const formattedResponse: KommoAuthResponse = {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresIn: response.expires_in,
          tokenType: response.token_type
        };

        console.log('Datos formateados:', formattedResponse);
        this.saveAuthData(formattedResponse);
      }),
      catchError(error => {
        console.error('Error en intercambio de token:', error);
        return throwError(() => error);
      })
    );
  }

  refreshToken(refreshToken: string): Observable<KommoAuthResponse> {
    console.log(`Intentando refrescar token con: ${refreshToken.substring(0, 10)}...`);

    const refreshData = { refreshToken: refreshToken };

    return this.http.post<any>(`${this.apiUrl}/kommo/refresh`, refreshData).pipe(
      tap(response => {
        console.log('Respuesta de refresh:', response);

        // Asegurarnos de que tenemos los datos esperados
        if (!response.access_token && !response.accessToken) {
          throw new Error('Formato de respuesta inválido');
        }

        // Mapear la respuesta al formato esperado
        const formattedResponse: KommoAuthResponse = {
          accessToken: response.access_token || response.accessToken,
          refreshToken: response.refresh_token || response.refreshToken,
          expiresIn: response.expires_in || response.expiresIn,
          tokenType: response.token_type || response.tokenType
        };

        console.log('Token refrescado exitosamente');
        this.saveAuthData(formattedResponse);
        return formattedResponse;
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
    console.log('Guardando datos de autenticación de Kommo', data);

    // Validar que tenemos todos los datos necesarios
    if (!data.accessToken) {
      console.error('Error: No hay accessToken en los datos recibidos');
      return;
    }

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
      console.log('Datos a guardar:', authData);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
      console.log('Datos de autenticación guardados con éxito');
    } catch (error) {
      console.error('Error al guardar datos de autenticación:', error);
    }
  }

// En el servicio Kommo
getAuthData(): (KommoAuthResponse & { expires_at: number }) | null {
  try {
    const data = localStorage.getItem(this.STORAGE_KEY);
    console.log('Raw localStorage data:', data);

    if (!data) return null;

    const parsed = JSON.parse(data);

    // Validar estructura
    if (!parsed.accessToken || !parsed.refreshToken) {
      console.error('Token inválido en localStorage:', parsed);
      return null;
    }

    console.log('Token válido encontrado:', {
      accessToken: `${parsed.accessToken.substring(0, 10)}...`,
      refreshToken: `${parsed.refreshToken.substring(0, 10)}...`,
      expires_at: new Date(parsed.expires_at).toISOString()
    });

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
    const isValid = now < auth.expires_at && !!auth.accessToken;

    console.log('Estado de autenticación Kommo:', isValid ? 'Válido' : 'Expirado',
                'Expira en:', new Date(auth.expires_at).toLocaleString(),
                'Token presente:', !!auth.accessToken);

    return isValid;
  }

  clearAuthData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Método para verificar y refrescar el token si está por expirar
  private checkAndRefreshTokenIfNeeded(): void {
    const auth = this.getAuthData();
    if (!auth || !auth.refreshToken) return;

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
