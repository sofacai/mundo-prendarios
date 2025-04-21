// src/app/core/services/bcra.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BcraService {
  private readonly API_URL = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas';

  constructor(private http: HttpClient) {}

  async consultarSituacion(cuit: string): Promise<number | null> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/${cuit}`)
      );

      const entidades = response?.results?.periodos?.[0]?.entidades;

      if (!entidades || entidades.length === 0) return null;

      // Obtener el valor de situación más alta entre todas las entidades (por si hay más de una)
      const situaciones = entidades.map((e: any) => e.situacion);
      const maxSituacion = Math.max(...situaciones);

      return maxSituacion;
    } catch (error) {
      console.error('Error al consultar BCRA:', error);
      return null;
    }
  }

}
