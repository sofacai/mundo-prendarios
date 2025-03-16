export interface Gasto {
  id: number;
  nombre: string;
  porcentaje: number;
  subcanalId?: number;
}

export interface GastoCreate {
  nombre: string;
  porcentaje: number;
  subcanalId: number;
}

export interface GastoUpdate {
  nombre: string;
  porcentaje: number;
}
