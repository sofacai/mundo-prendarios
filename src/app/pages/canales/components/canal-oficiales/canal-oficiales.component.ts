import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from 'src/app/core/services/usuario.service';

@Component({
  selector: 'app-canal-oficiales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-oficiales.component.html',
  styleUrls: ['./canal-oficiales.component.scss']
})
export class CanalOficialesComponent implements OnInit {
  @Input() oficialesComerciales: any[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() toggleEstado = new EventEmitter<{oficialId: number, estadoActual: boolean}>();
  @Output() verDetalle = new EventEmitter<number>();

  // Mapa para manejar el estado de carga por oficial
  loadingOficiales: Map<number, boolean> = new Map();

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    // Verificar el estado real de cada oficial al inicializar
    this.verificarEstadoOficiales();
  }

  verificarEstadoOficiales(): void {
    if (this.oficialesComerciales && this.oficialesComerciales.length > 0) {
      this.oficialesComerciales.forEach(oficial => {
        // Obtener el estado actualizado del usuario
        this.usuarioService.getUsuario(oficial.oficialComercialId).subscribe({
          next: (usuario) => {
            // Actualizar el estado en la lista local si no coincide
            if (oficial.activo !== usuario.activo) {
              oficial.activo = usuario.activo;
            }
          },
          error: (err) => {
            console.error(`Error al verificar estado del oficial ${oficial.oficialComercialId}:`, err);
          }
        });
      });
    }
  }

  onToggleEstado(oficialId: number, estadoActual: boolean): void {
    // Marcar este oficial como en proceso de carga
    this.loadingOficiales.set(oficialId, true);

    // Emitir evento al componente padre
    this.toggleEstado.emit({ oficialId, estadoActual });

    // Simular tiempo de respuesta y actualizar estado localmente
    // Nota: En un caso real, esto se haría en el callback de éxito del servicio
    setTimeout(() => {
      // Actualizar el estado visual después de un tiempo
      this.oficialesComerciales = this.oficialesComerciales.map(oficial => {
        if (oficial.oficialComercialId === oficialId) {
          return {...oficial, activo: !estadoActual};
        }
        return oficial;
      });

      // Quitar indicador de carga
      this.loadingOficiales.set(oficialId, false);
    }, 500);
  }

  onVerDetalle(oficialId: number): void {
    this.verDetalle.emit(oficialId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  isOficialLoading(oficialId: number): boolean {
    return this.loadingOficiales.get(oficialId) === true;
  }
}
