// Actualizamos CotizadorDataService para mantener información de subcanal

import { Injectable } from '@angular/core';
import { SubcanalInfo } from './cotizador.service';

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

  // Información del subcanal seleccionado
  subcanalInfo?: SubcanalInfo;

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
  auto?: string;
  codigoPostal?: number;
  estadoCivil?: string;

  constructor() { }

  // Guardar datos del paso 1
  guardarDatosPaso1(datos: {
    monto: number,
    plazo: number,
    planTipo: 'Cuotas Fijas' | 'UVA',
    valorCuota: number,
    planId: number,
    vendorId?: number
  }) {
    this.monto = datos.monto;
    this.plazo = datos.plazo;
    this.planTipo = datos.planTipo;
    this.valorCuota = datos.valorCuota;
    this.planId = datos.planId;
    if (datos.vendorId) {
      this.vendorId = datos.vendorId;
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
    this.auto = datos.auto;
    this.codigoPostal = datos.codigoPostal;
    this.estadoCivil = datos.estadoCivil;
  }

  // Guardar información del subcanal
  guardarSubcanalInfo(subcanalInfo: SubcanalInfo) {
    this.subcanalInfo = subcanalInfo;
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

    this.subcanalInfo = undefined;

    this.situacionBcra = 0;
    this.bcraPeriodo = '';
    this.bcraFormatted = '';
    this.rechazadoPorBcra = false;
  }


}
