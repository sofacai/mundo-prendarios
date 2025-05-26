import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, catchError } from 'rxjs';
import { throwError } from 'rxjs';

export interface BcraResponse {
  situacion: number | null;
  periodo: string | null;
  formatted: string | null; // Para almacenar el formato situacion#periodo
}

@Injectable({
  providedIn: 'root'
})
export class BcraService {
  private readonly API_URL = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas';

  constructor(private http: HttpClient) {}

  async consultarSituacion(cuit: string): Promise<BcraResponse> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/${cuit}`).pipe(
          catchError(error => {
            // Preservar el status del error para un manejo específico en el componente
            return throwError(() => error);
          })
        )
      );

      const periodos = response?.results?.periodos;

      if (!periodos || periodos.length === 0) {
        return { situacion: null, periodo: null, formatted: null };
      }

      // Tomamos el período más reciente (primer elemento del array)
      const periodoActual = periodos[0].periodo;
      const entidades = periodos[0].entidades;

      if (!entidades || entidades.length === 0) {
        return { situacion: null, periodo: periodoActual, formatted: null };
      }

      // Obtener el valor de situación más alta entre todas las entidades
      const situaciones = entidades.map((e: any) => e.situacion);
      const maxSituacion = Math.max(...situaciones);

      // Crear formato combinado para Kommo: situacion#periodo
      const formatted = `${maxSituacion}#${periodoActual}`;

      return {
        situacion: maxSituacion,
        periodo: periodoActual,
        formatted: formatted
      };
    } catch (error) {
      // Propagamos el error para manejarlo en el componente
      throw error;
    }
  }
}
