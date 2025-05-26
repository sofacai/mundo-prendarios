import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CanalService } from 'src/app/core/services/canal.service';
import { RolType } from 'src/app/core/models/usuario.model';
import { UsuarioFormComponent } from 'src/app/shared/modals/usuario-form/usuario-form.component';

@Component({
  selector: 'app-canal-oficiales',
  standalone: true,
  imports: [CommonModule, FormsModule, UsuarioFormComponent],
  templateUrl: './canal-oficiales.component.html',
  styleUrls: ['./canal-oficiales.component.scss']
})
export class CanalOficialesComponent implements OnInit, OnChanges {
  @Input() oficialesComerciales: any[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() canalId: number = 0;

  @Output() toggleEstado = new EventEmitter<{oficialId: number, estadoActual: boolean}>();
  @Output() verDetalle = new EventEmitter<number>();
  @Output() oficialAsignado = new EventEmitter<number>();
  @Output() oficialDesasignado = new EventEmitter<number>();
  rolOficialComercial = RolType.OficialComercial;


  // Mapa para manejar el estado de carga por oficial
  loadingOficiales: Map<number, boolean> = new Map();

  // Variables para modal de asignación
  showModal = false;
  selectedOficialId: string | number = '';
  availableOficiales: UsuarioDto[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  assigning = false;

  // Modal de creación de oficial
  showCrearOficialModal = false;

  // Determinar si el usuario es administrador
  isAdmin = false;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private canalService: CanalService
  ) { }

  ngOnInit(): void {
    // Verificar el estado real de cada oficial al inicializar
    this.verificarEstadoOficiales();

    // Determinar si el usuario actual es administrador
    const currentUser = this.authService.currentUserValue;
    this.isAdmin = currentUser?.rolId === RolType.Administrador;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si la lista de oficiales comerciales cambia, verificar sus estados
    if (changes['oficialesComerciales'] && !changes['oficialesComerciales'].firstChange) {
      this.verificarEstadoOficiales();
    }
  }

  verificarEstadoOficiales(): void {
    if (this.oficialesComerciales && this.oficialesComerciales.length > 0) {
      // Marcar todos los oficiales como "verificando"
      const promises = this.oficialesComerciales.map(oficial => {
        // Obtener el ID del oficial (dependiendo de cómo venga la estructura)
        const oficialId = oficial.oficialComercialId || oficial.id;

        // Establecer oficiales como activos hasta que se confirme lo contrario
        // Esto soluciona el problema del primer oficial apareciendo como inactivo
        if (oficial.activo === undefined && oficial.estado === undefined) {
          oficial.activo = true;
        }

        // Retornar una promesa para cada verificación
        return new Promise<void>((resolve) => {
          this.usuarioService.getUsuario(oficialId).subscribe({
            next: (usuario) => {
              // Asignar el estado real del backend
              // Usando referencia directa para actualizar el array original
              oficial.activo = usuario.activo;
              oficial.estado = usuario.activo ? 'Activo' : 'Inactivo';
              resolve();
            },
            error: (err) => {
              resolve(); // Resolver incluso en caso de error
            }
          });
        });
      });

      // Esperar a que todas las verificaciones terminen y forzar actualización
      Promise.all(promises).then(() => {
        // Esto fuerza a Angular a detectar el cambio en el array
        this.oficialesComerciales = [...this.oficialesComerciales];
      });
    }
  }

  onToggleEstado(oficialId: number, estadoActual: boolean): void {
    // Marcar este oficial como en proceso de carga
    this.loadingOficiales.set(oficialId, true);

    // Emitir evento al componente padre
    this.toggleEstado.emit({ oficialId, estadoActual });

    // No hacemos cambios locales y esperamos a que el componente padre
    // actualice los datos después de la operación
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

  // Métodos para el modal de asignación de oficiales
  openModal(): void {
    if (!this.isAdmin) return;

    this.showModal = true;
    this.selectedOficialId = '';
    this.errorMessage = null;
    this.isLoading = true;

    this.loadDisponibleOficiales();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedOficialId = '';
    this.errorMessage = null;
  }

  loadDisponibleOficiales(): void {
    this.isLoading = true;

    // Obtener oficiales comerciales (rol 4)
    this.usuarioService.getUsuariosPorRol(RolType.OficialComercial)
      .subscribe({
        next: (oficiales) => {
          // Filtrar los que ya están asignados al canal
          this.availableOficiales = oficiales.filter(oficial => {
            return !this.oficialesComerciales.some(o => {
              const id = o.oficialComercialId || o.id;
              return id === oficial.id;
            });
          });
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = "Error al cargar los oficiales disponibles";
          this.isLoading = false;
        }
      });
  }

  confirmarAsignacion(): void {
    if (!this.selectedOficialId || this.assigning || !this.isAdmin || !this.canalId) return;

    this.assigning = true;
    this.errorMessage = null;

    const oficialId = Number(this.selectedOficialId);

    this.canalService.asignarOficialComercialACanal(this.canalId, oficialId)
      .subscribe({
        next: () => {
          this.assigning = false;

          // Buscar el oficial en la lista disponible
          const oficial = this.availableOficiales.find(o => o.id === oficialId);

          if (oficial) {
            // Añadir el oficial a la lista de asignados con estado explicitamente activo
            const nuevoOficial = {
              oficialComercialId: oficial.id,
              oficialComercialNombre: `${oficial.nombre} ${oficial.apellido}`,
              activo: true, // Forzar estado activo
              email: oficial.email,
              telefono: oficial.telefono
            };

            // Añadir a la lista existente
            this.oficialesComerciales = [...this.oficialesComerciales, nuevoOficial];

            // Emitir evento
            this.oficialAsignado.emit(oficialId);
          }

          this.closeModal();
        },
        error: (error) => {
          this.assigning = false;
          this.errorMessage = "Error al asignar el oficial comercial";
        }
      });
  }

  // Métodos para creación de oficial
  crearNuevoOficial(): void {
    if (!this.isAdmin) return;
    this.showCrearOficialModal = true;
  }

  closeCrearOficialModal(): void {
    this.showCrearOficialModal = false;
  }

  onOficialCreado(oficial: UsuarioDto): void {
    this.showCrearOficialModal = false;

    // Si el oficial se creó exitosamente, asignarlo al canal
    if (oficial && oficial.id && this.canalId) {
      this.canalService.asignarOficialComercialACanal(this.canalId, oficial.id)
        .subscribe({
          next: () => {
            // Crear un nuevo objeto con la estructura correcta y estado explícitamente activo
            const nuevoOficial = {
              oficialComercialId: oficial.id,
              oficialComercialNombre: `${oficial.nombre} ${oficial.apellido}`,
              activo: true, // Forzar estado activo
              email: oficial.email,
              telefono: oficial.telefono
            };

            // Añadir a la lista existente
            this.oficialesComerciales = [...this.oficialesComerciales, nuevoOficial];

            // Emitir evento
            this.oficialAsignado.emit(oficial.id);
          },
          error: (error) => {
          }
        });
    }
  }

  onDesasignarOficial(oficialId: number): void {
    if (!this.isAdmin || !this.canalId) return;

    this.loadingOficiales.set(oficialId, true);

    this.canalService.desasignarOficialComercialDeCanal(this.canalId, oficialId)
      .subscribe({
        next: () => {
          // Eliminar de la lista local
          this.oficialesComerciales = this.oficialesComerciales.filter(oficial => {
            const id = oficial.oficialComercialId || oficial.id;
            return id !== oficialId;
          });

          this.loadingOficiales.delete(oficialId);

          // Emitir evento
          this.oficialDesasignado.emit(oficialId);
        },
        error: (error) => {
          this.loadingOficiales.delete(oficialId);
        }
      });
  }
}
