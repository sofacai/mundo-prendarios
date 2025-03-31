// src/app/pages/usuarios/components/usuario-header/usuario-header.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioDto, VendorEstadisticasDto } from 'src/app/core/services/usuario.service';
import { RolType } from 'src/app/core/models/usuario.model';

@Component({
  selector: 'app-usuario-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-header.component.html',
  styleUrls: ['./usuario-header.component.scss']
})
export class UsuarioHeaderComponent {
  @Input() usuario!: UsuarioDto;
  @Input() estadisticas: VendorEstadisticasDto | null = null;

  @Output() toggleEstado = new EventEmitter<void>();

  // Control de previsualización de imagen
  showImagePreview: boolean = false;

  // Constantes para mapear el tipo de rol a un nombre legible
  readonly ROL_NAMES = {
    1: 'Administrador',
    2: 'Admin de Canal',
    3: 'Vendor',
    4: 'Oficial Comercial'
  };

  constructor() { }

  onToggleEstado(): void {
    this.toggleEstado.emit();
  }

  // Obtener iniciales del nombre para el avatar
  getInitials(): string {
    if (!this.usuario) return '';

    const nombre = this.usuario.nombre || '';
    const apellido = this.usuario.apellido || '';

    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
  }

  // Método para mostrar la previsualización
  onImageClick(): void {
    // Nota: Actualmente no hay foto en UsuarioDto
    // En caso de implementar fotos en el futuro, descomentar este código
    /*
    if (this.usuario && this.usuario.foto) {
      this.showImagePreview = true;
      // Evitar scroll del body mientras el modal está abierto
      document.body.style.overflow = 'hidden';
    }
    */
  }

  // Método para cerrar la previsualización (no se usa actualmente)
  closeImagePreview(): void {
    // Nota: Actualmente no hay foto en UsuarioDto
    /*
    this.showImagePreview = false;
    // Restaurar scroll del body
    document.body.style.overflow = '';
    */
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return 'No disponible';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Método para obtener el rol como texto
  getRolName(): string {
    if (!this.usuario) return '';

    // Usando el índice como un número
    const rolId = this.usuario.rolId;
    return (rolId && this.ROL_NAMES[rolId as keyof typeof this.ROL_NAMES]) ||
           this.usuario.rolNombre ||
           'Desconocido';
  }
}
