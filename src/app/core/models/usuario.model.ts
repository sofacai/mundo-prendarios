export enum RolType {
  Administrador = 1,
  AdminCanal = 2,
  Vendor = 3,
  OficialComercial = 4
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rolId: RolType;
  rol: string;
  token?: string;
  activo: boolean;
}
