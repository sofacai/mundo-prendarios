export interface Operacion {
  id?: number;
  monto: number;
  meses: number;
  tasa: number;
  clienteId: number;
  clienteNombre?: string;
  planId: number;
  planNombre?: string;
  vendedorId?: number;
  vendedorNombre?: string;
  subcanalId: number;
  subcanalNombre?: string;
  canalId: number;
  canalNombre?: string;
  fechaCreacion?: Date;
  estado?: string;
  usuarioCreadorId?: number;

  // Campos existentes
  montoAprobado?: number;
  montoAprobadoBanco?: number;
  mesesAprobados?: number;
  tasaAprobada?: number;
  planAprobadoId?: number;
  planAprobadoNombre?: string;
  fechaAprobacion?: Date;
  fechaProcLiq?: Date;
  liquidada?: boolean;
  fechaLiquidacion?: Date;
  cuotaInicial?: number;
  cuotaInicialAprobada?: number;
  cuotaPromedio?: number;
  cuotaPromedioAprobada?: number;
  autoInicial?: string;
  autoAprobado?: string;
  urlAprobadoDefinitivo?: string;
  observaciones?: string;

  // *** NUEVOS CAMPOS AGREGADOS ***
  gastoInicial?: number;
  gastoAprobado?: number;
  bancoInicial?: string;
  bancoAprobado?: string;
  estadoDashboard?: string;
}
