import { Injectable } from '@angular/core';
import { SubcanalInfo } from './cotizador.service';

export enum AntiguedadGrupo {
  A = 'A', // 0km a 8 años
  B = 'B', // 9 a 10 años
  C = 'C'  // 11 a 15 años
}

@Injectable({
  providedIn: 'root'
})
export class CotizadorDataService {

  rechazadoPorBcra: boolean = false;
  situacionBcra: number = 0;
  bcraPeriodo: string = '';
  bcraFormatted: string = '';

  // Datos del paso 1
  monto: number = 0;
  plazo: number = 0;
  planTipo: 'Cuotas Fijas' | 'UVA' = 'UVA';
  valorCuota: number = 0;
  planId: number = 0;
  vendorId?: number;
  dniConyuge?: string;

  modoSimulacion: boolean = false;

  // Información de antigüedad del auto
  auto?: string; // Será '0km' o el año del auto
  isAuto0km: boolean = true;
  antiguedadGrupo: AntiguedadGrupo = AntiguedadGrupo.A;
  tasaAplicada?: number; // Tasa específica que se aplicó según antigüedad

  // Información del subcanal seleccionado
  subcanalInfo?: SubcanalInfo;

  cuotaInicial: number = 0;
  cuotaInicialAprobada: number = 0;
  cuotaPromedio: number = 0;
  cuotaPromedioAprobada: number = 0;
  autoInicial: string = '';
  autoAprobado: string = '';
  urlAprobadoDefinitivo: string = '';
  observaciones: string = '';

  // Datos del paso 2
  clienteId?: number;
  nombre: string = '';
  apellido: string = '';
  whatsapp: string = '';
  email: string = '';
  dni?: string;
  cuil?: string;
  sexo?: string;

  ingresos?: number;
  codigoPostal?: number;
  estadoCivil?: string;

  // ID de la operación creada
  operacionId?: number;

  constructor() { }

  // Guardar datos del paso 1 - Actualizado para incluir antigüedad
  guardarDatosPaso1(datos: {
    monto: number,
    plazo: number,
    planTipo: 'Cuotas Fijas' | 'UVA',
    valorCuota: number,
    planId: number,
    vendorId?: number,
    auto?: string,
    antiguedadGrupo?: AntiguedadGrupo,
    tasaAplicada?: number,
    cuotaInicial?: number,
    cuotaPromedio?: number
  }) {
    this.monto = datos.monto;
    this.plazo = datos.plazo;
    this.planTipo = datos.planTipo;
    this.valorCuota = datos.valorCuota;
    this.planId = datos.planId;
    if (datos.vendorId) {
      this.vendorId = datos.vendorId;
    }
    if (datos.cuotaInicial) {
      this.cuotaInicial = datos.cuotaInicial;
    }
    if (datos.cuotaPromedio) {
      this.cuotaPromedio = datos.cuotaPromedio;
    }
    if (datos.auto) {
      this.auto = datos.auto;
      this.isAuto0km = datos.auto === '0km';
    }
    if (datos.antiguedadGrupo) {
      this.antiguedadGrupo = datos.antiguedadGrupo;
    }
    if (datos.tasaAplicada) {
      this.tasaAplicada = datos.tasaAplicada;
    }
  }

  // Guardar datos del paso 2
  guardarDatosPaso2(datos: {
    nombre: string,
    apellido: string,
    whatsapp: string,
    email: string,
    dni?: string,
    cuil?: string,
    sexo?: string,
    clienteId?: number,
    ingresos?: number;
    auto?: string;
    codigoPostal?: number;
    estadoCivil?: string;
    dniConyuge?: string;
  }) {
    this.nombre = datos.nombre;
    this.apellido = datos.apellido;
    this.whatsapp = datos.whatsapp;
    this.email = datos.email;
    this.dni = datos.dni;
    this.cuil = datos.cuil;
    this.sexo = datos.sexo;
    this.clienteId = datos.clienteId;
    this.ingresos = datos.ingresos;
    // Solo actualizar auto si viene en los datos del paso 2
    if (datos.auto) {
      this.auto = datos.auto;
      this.isAuto0km = datos.auto === '0km';
    }
    this.codigoPostal = datos.codigoPostal;
    this.estadoCivil = datos.estadoCivil;
    this.dniConyuge = datos.dniConyuge;

  }

  // Guardar información del subcanal
  guardarSubcanalInfo(subcanalInfo: SubcanalInfo) {
    this.subcanalInfo = subcanalInfo;
  }

  // Guardar ID de operación
  guardarOperacionId(operacionId: number) {
    this.operacionId = operacionId;
  }

  // Reiniciar todos los datos
  reiniciarDatos() {
    this.monto = 0;
    this.plazo = 0;
    this.planTipo = 'UVA';
    this.valorCuota = 0;
    this.planId = 0;

    this.clienteId = undefined;
    this.nombre = '';
    this.apellido = '';
    this.whatsapp = '';
    this.email = '';
    this.dni = undefined;
    this.cuil = undefined;
    this.sexo = undefined;
    this.vendorId = undefined;

    this.auto = undefined;
    this.isAuto0km = true;
    this.antiguedadGrupo = AntiguedadGrupo.A;
    this.tasaAplicada = undefined;

    this.subcanalInfo = undefined;

    this.situacionBcra = 0;
    this.bcraPeriodo = '';
    this.bcraFormatted = '';
    this.rechazadoPorBcra = false;

    this.operacionId = undefined;

    this.cuotaInicial = 0;
    this.cuotaInicialAprobada = 0;
    this.cuotaPromedio = 0;
    this.cuotaPromedioAprobada = 0;
    this.autoInicial = '';
    this.autoAprobado = '';
    this.urlAprobadoDefinitivo = '';
    this.observaciones = '';
  }
}
