import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

export interface SubcanalInfo {
  subcanalId: number;
  subcanalNombre: string;
  subcanalActivo: boolean;
  subcanalComision?: number; // Añadido para manejar la comisión del subcanal
  canalId: number;
  gastos: Array<{
    id: number;
    nombre: string;
    porcentaje: number;
  }>;
  planesDisponibles: Array<{
    id: number;
    nombre: string;
    tasa: number;
    montoMinimo: number;
    montoMaximo: number;
    cuotasAplicables: number[];
  }>;
}

export interface DatosWizard {
  subcanales?: SubcanalInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class CotizadorService {

  private apiUrl = environment.apiUrl;
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getDatosWizard(vendorId?: number): Observable<DatosWizard> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/VendorInfo/wizard-data`;

    if (vendorId) {
      url += `?vendorId=${vendorId}`;
    }

    return this.http.get<DatosWizard>(url, { headers });
  }

  getPlanesParaCotizar(monto: number, plazo: number, subcanalId: number, antiguedadGrupo: string = 'A'): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/VendorInfo/planes-cotizar?monto=${monto}&plazo=${plazo}&subcanalId=${subcanalId}&antiguedadGrupo=${antiguedadGrupo}`,
      { headers }
    );
  }

  calcularCuotaConAntiguedad(monto: number, plazo: number, planId: number, antiguedadGrupo: string, gastos: any[]): Observable<number> {
    // Primero obtenemos la tasa específica según el plan, plazo y antigüedad
    return this.http.get<any>(`${this.apiUrl}/PlanTasa/plan/${planId}/plazo/${plazo}`).pipe(
      map(tasa => {
        // Seleccionar la tasa según el grupo de antigüedad
        let tasaAplicada = tasa.tasaA; // Por defecto, grupo A

        if (antiguedadGrupo === 'B') {
          tasaAplicada = tasa.tasaB;
        } else if (antiguedadGrupo === 'C') {
          tasaAplicada = tasa.tasaC;
        }

        // Calcular cuota con la tasa seleccionada
        return this.calcularCuota(monto, plazo, tasaAplicada, gastos);
      }),
      catchError(error => {
        // En caso de error, intentamos con la tasa general del plan
        return this.http.get<any>(`${this.apiUrl}/Plan/${planId}`).pipe(
          map(plan => {
            return this.calcularCuota(monto, plazo, plan.tasa, gastos);
          }),
          catchError(err => {
            return of(0); // Retornar 0 en caso de error total
          })
        );
      })
    );
  }

  calcularCuota(monto: number, plazo: number, tasa: number, gastos: any[]): number {

    const porcentajeGastos = gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);

    // Monto con gastos
    const montoConGastos = monto * (1 + porcentajeGastos / 100);

    // Tasa mensual (TNA/12)
    const tasaMensual = tasa / 100 / 12;

    // Cálculo usando la fórmula de amortización francesa
    // C = P * [i(1+i)^n] / [(1+i)^n - 1]
    const tasaFactor = Math.pow(1 + tasaMensual, plazo);
    const numerador = tasaMensual * tasaFactor;
    const denominador = tasaFactor - 1;
    const cuotaPura = montoConGastos * (numerador / denominador);

    // Verificar si hay IVA a aplicar (21% sobre intereses)
    // Para esto, calculamos la primera cuota para saber los intereses
    const primerInteres = montoConGastos * tasaMensual;
    const ivaPrimerInteres = primerInteres * 0.21;

    const cuotaFinal = Math.round(cuotaPura + ivaPrimerInteres);

    return cuotaFinal;
  }

  calcularCuotaFrancesaPura(monto: number, plazo: number, tasaAnual: number, gastos: any[]): number {

    // Suma de porcentajes de gastos
    const porcentajeGastos = gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);

    // Monto con gastos
    const montoConGastos = monto * (1 + porcentajeGastos / 100);

    // Tasa mensual (TNA/12)
    const tasaMensual = tasaAnual / 100 / 12;

    const factor = Math.pow(1 + tasaMensual, plazo);
    const cuota = montoConGastos * (tasaMensual * factor) / (factor - 1);

    return Math.round(cuota);
  }

  // Actualizar método calcularTablaAmortizacionFrancesa para usar el mismo cálculo preciso
  calcularTablaAmortizacionFrancesa(monto: number, plazo: number, tasa: number, gastos: any[]): any[] {

    const porcentajeGastos = gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);

    const prestamo = monto * (1 + porcentajeGastos / 100);

    const tasaMensual = tasa / 100 / 12;

    const factor = Math.pow(1 + tasaMensual, plazo);
    const cuotaFija = prestamo * (tasaMensual * factor) / (factor - 1);

    // Tabla de amortización
    const tabla: any[] = [];

    // Registro inicial (saldo inicial)
    tabla.push({
      nroCuota: 0,
      capital: 0,
      interes: 0,
      iva: 0,
      gasto: 0,
      cuota: 0,
      saldo: prestamo
    });

    // Calcular cada cuota
    let saldoAnterior = prestamo;
    let totalIntereses = 0;
    let totalCapital = 0;

    for (let i = 1; i <= plazo; i++) {
      // Interés de la cuota = Saldo anterior * tasa mensual
      const interesMensual = saldoAnterior * tasaMensual;
      totalIntereses += interesMensual;

      // Capital = Cuota fija - Interés
      const capitalMensual = cuotaFija - interesMensual;
      totalCapital += capitalMensual;

      // Nuevo saldo = Saldo anterior - Capital amortizado
      const nuevoSaldo = saldoAnterior - capitalMensual;

      if (i === 1 || i === plazo) {

      }

      // Agregar a la tabla
      tabla.push({
        nroCuota: i,
        capital: Math.round(capitalMensual),
        interes: Math.round(interesMensual),
        iva: 0, // Ya está incluido en la cuota
        gasto: 0, // No hay gastos mensuales adicionales
        cuota: Math.round(cuotaFija),
        saldo: Math.round(nuevoSaldo)
      });

      // Actualizar saldo para el próximo cálculo
      saldoAnterior = nuevoSaldo;
    }


    return tabla;
  }

  guardarCotizacion(datos: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/VendorInfo/guardar-cotizacion`, datos, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  calcularTablaAmortizacionConAntiguedad(monto: number, plazo: number, planId: number, antiguedadGrupo: string, gastos: any[]): Observable<any[]> {
    // Primero obtenemos la tasa específica según el plan, plazo y antigüedad
    return this.http.get<any>(`${this.apiUrl}/PlanTasa/plan/${planId}/plazo/${plazo}`).pipe(
      map(tasa => {
        // Seleccionar la tasa según el grupo de antigüedad
        let tasaAplicada = tasa.tasaA; // Por defecto, grupo A

        if (antiguedadGrupo === 'B') {
          tasaAplicada = tasa.tasaB;
        } else if (antiguedadGrupo === 'C') {
          tasaAplicada = tasa.tasaC;
        }

        // Calcular tabla con la tasa seleccionada
        return this.calcularTablaAmortizacionFrancesa(monto, plazo, tasaAplicada, gastos);
      }),
      catchError(error => {
        console.error('Error al obtener tasa para tabla de amortización:', error);
        // En caso de error, intentamos con la tasa general del plan
        return this.http.get<any>(`${this.apiUrl}/Plan/${planId}`).pipe(
          map(plan => {
            return this.calcularTablaAmortizacionFrancesa(monto, plazo, plan.tasa, gastos);
          }),
          catchError(err => {
            console.error('Error al obtener plan para tabla de amortización:', err);
            return of([]); // Retornar array vacío en caso de error total
          })
        );
      })
    );
  }

  // Implementación existente (sistema alemán)
  calcularTablaAmortizacion(monto: number, plazo: number, tasa: number, gastos: any[]): any[] {
    // Calcular el porcentaje total de gastos
    const porcentajeGastos = gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);

    // Préstamo = monto + gastos
    const prestamo = monto * (1 + porcentajeGastos / 100);

    // Capital fijo mensual
    const capitalMensual = Math.round(prestamo / plazo);

    // Tabla de amortización
    const tabla: any[] = [];

    // Registro inicial (saldo inicial)
    tabla.push({
      nroCuota: 0,
      capital: 0,
      interes: 0,
      iva: 0,
      gasto: 0,
      cuota: 0,
      saldo: prestamo
    });

    // Calcular cada cuota
    let saldoAnterior = prestamo;

    for (let i = 1; i <= plazo; i++) {
      // Interés mensual = Saldo anterior * (TNA/360*30)
      const interesMensual = Math.round(saldoAnterior * ((tasa / 100) / 360 * 30));

      // IVA = 21% del interés
      const ivaMensual = Math.round(interesMensual * 0.21);

      // Cuota = Capital + Interés + IVA
      const cuotaMensual = capitalMensual + interesMensual + ivaMensual;

      // Nuevo saldo = Saldo anterior - Capital
      const nuevoSaldo = saldoAnterior - capitalMensual;

      // Agregar a la tabla
      tabla.push({
        nroCuota: i,
        capital: capitalMensual,
        interes: interesMensual,
        iva: ivaMensual,
        gasto: 0, // No hay gastos mensuales adicionales
        cuota: cuotaMensual,
        saldo: nuevoSaldo
      });

      // Actualizar saldo para el próximo cálculo
      saldoAnterior = nuevoSaldo;
    }

    return tabla;
  }



  esSistemaAleman(planId: number | undefined): boolean {
    // Si planId es undefined o no es un número, retornar false
    if (planId === undefined) {
      return false;
    }

    // Convertir a número si es string para asegurar la comparación
    const id = Number(planId);
    if (isNaN(id)) {
      return false;
    }

    // El planId 1 usa sistema alemán, el resto usa sistema francés
    return id === 1;
  }

  esSistemaFrances(planId: number | undefined): boolean {
    return !this.esSistemaAleman(planId);
  }
}
