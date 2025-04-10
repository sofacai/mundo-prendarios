export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni?: string;
  cuil?: string;
  provincia?: string;
  sexo?: string;
  estadoCivil?: string;
  canalId: number;
  canalNombre: string;
  fechaCreacion: Date;
  ultimaModificacion?: Date;
  usuarioCreadorId?: number;
  usuarioCreadorNombre?: string;
  vendoresAsignados?: any[];
  numeroOperaciones: number;

  ingresos?: number;
  auto?: string;
  codigoPostal?: number;
  fechaNacimiento?: string; // o Date si lo convertís después
}
