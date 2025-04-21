import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { RolType } from 'src/app/core/models/usuario.model';
import { UsuarioFormComponent } from 'src/app/shared/modals/usuario-form/usuario-form.component';

@Component({
  selector: 'app-subcanal-admin-canal',
  standalone: true,
  imports: [CommonModule, FormsModule, UsuarioFormComponent],
  templateUrl: './subcanal-admin-canal.component.html',
  styleUrls: ['./subcanal-admin-canal.component.scss']
})
export class SubcanalAdminCanalComponent implements OnInit {
  @Input() adminCanal: UsuarioDto | null = null;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() subcanalId: number = 0;

  @Output() adminAsignado = new EventEmitter<number>();
  @Output() adminDesasignado = new EventEmitter<number>();

  rolAdminCanal = RolType.AdminCanal;

  // Variables para modal de asignación
  showModal = false;
  selectedAdminId: string | number = '';
  availableAdmins: UsuarioDto[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  assigning = false;

  // Modal de creación de admin canal
  showCrearAdminModal = false;

  // Determinar si el usuario es administrador
  isAdmin = false;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Determinar si el usuario actual es administrador
    const currentUser = this.authService.currentUserValue;
    this.isAdmin = currentUser?.rolId === RolType.Administrador;
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Métodos para el modal de asignación de admins
  openModal(): void {
    if (!this.isAdmin) return;

    this.showModal = true;
    this.selectedAdminId = '';
    this.errorMessage = null;
    this.isLoading = true;

    this.loadDisponibleAdmins();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedAdminId = '';
    this.errorMessage = null;
  }

  loadDisponibleAdmins(): void {
    this.isLoading = true;

    // Obtener admins canales (rol 2)
    this.usuarioService.getUsuariosPorRol(RolType.AdminCanal)
      .subscribe({
        next: (admins) => {
          // Filtrar los que están activos Y no son el admin actual
          this.availableAdmins = admins.filter(admin =>
            admin.activo &&
            (!this.adminCanal || admin.id !== this.adminCanal.id)
          );

          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = "Error al cargar los administradores disponibles";
          this.isLoading = false;
        }
      });
  }

  confirmarAsignacion(): void {
    if (!this.selectedAdminId || this.assigning || !this.isAdmin || !this.subcanalId) return;

    this.assigning = true;
    this.errorMessage = null;

    const adminId = Number(this.selectedAdminId);

    // Emitir el evento al componente padre para que maneje la asignación
    this.adminAsignado.emit(adminId);

    // Cerrar el modal después de iniciar la asignación
    this.assigning = false;
    this.closeModal();
  }

  // Métodos para creación de admin canal
  crearNuevoAdmin(): void {
    if (!this.isAdmin) return;
    this.showCrearAdminModal = true;
  }

  closeCrearAdminModal(): void {
    this.showCrearAdminModal = false;
  }

  onAdminCreado(admin: UsuarioDto): void {
    this.showCrearAdminModal = false;

    // Si el admin se creó exitosamente, emitir evento
    if (admin && admin.id) {
      this.adminAsignado.emit(admin.id);
    }
  }

  onDesasignarAdmin(): void {
    if (!this.isAdmin || !this.subcanalId || !this.adminCanal) return;

    if (confirm('¿Está seguro que desea desasignar este administrador del subcanal?')) {
      // Emitir evento al componente padre para que maneje la desasignación
      this.adminDesasignado.emit(this.adminCanal.id);
    }
  }
}
