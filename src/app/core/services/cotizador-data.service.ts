import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CotizadorDataService {
  // Datos del paso 1
  monto: number = 0;
  plazo: number = 0;
  planTipo: 'Cuotas Fijas' | 'UVA' = 'UVA';
  valorCuota: number = 0;
  planId: number = 0;

  // Datos del paso 2
  clienteId?: number;
  nombre: string = '';
  apellido: string = '';
  whatsapp: string = '';
  email: string = '';
  dni?: string;
  cuil?: string;
  sexo?: string;

  constructor() { }

  // Guardar datos del paso 1
  guardarDatosPaso1(datos: {
    monto: number,
    plazo: number,
    planTipo: 'Cuotas Fijas' | 'UVA',
    valorCuota: number,
    planId: number
  }) {
    this.monto = datos.monto;
    this.plazo = datos.plazo;
    this.planTipo = datos.planTipo;
    this.valorCuota = datos.valorCuota;
    this.planId = datos.planId;
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
    clienteId?: number
  }) {
    this.nombre = datos.nombre;
    this.apellido = datos.apellido;
    this.whatsapp = datos.whatsapp;
    this.email = datos.email;
    this.dni = datos.dni;
    this.cuil = datos.cuil;
    this.sexo = datos.sexo;
    this.clienteId = datos.clienteId;
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
  }
}
