// src/app/core/services/ubicacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';

export interface Provincia {
  id: string;
  nombre: string;
}

export interface Localidad {
  id: string;
  nombre: string;
  provincia: {
    id: string;
    nombre: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private baseUrl = 'https://apis.datos.gob.ar/georef/api';

  // Cache para evitar peticiones repetidas
  private provinciasCache: Provincia[] | null = null;
  private localidadesCache: Map<string, Localidad[]> = new Map();

  constructor(private http: HttpClient) { }

  getProvincias(): Observable<Provincia[]> {
    if (this.provinciasCache) {
      return of(this.provinciasCache);
    }

    return this.http.get<any>(`${this.baseUrl}/provincias`)
      .pipe(
        map(response => {
          this.provinciasCache = response.provincias;
          return response.provincias.sort((a: Provincia, b: Provincia) =>
            a.nombre.localeCompare(b.nombre));
        })
      );
  }

  getLocalidades(provinciaId: string): Observable<Localidad[]> {
    if (this.localidadesCache.has(provinciaId)) {
      return of(this.localidadesCache.get(provinciaId)!);
    }

    return this.http.get<any>(`${this.baseUrl}/localidades?provincia=${provinciaId}&max=5000`)
      .pipe(
        map(response => {
          const localidades = response.localidades.sort((a: Localidad, b: Localidad) =>
            a.nombre.localeCompare(b.nombre));
          this.localidadesCache.set(provinciaId, localidades);
          return localidades;
        })
      );
  }
}
