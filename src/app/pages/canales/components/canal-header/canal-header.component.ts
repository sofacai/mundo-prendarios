// Archivo: src/app/pages/canales/components/canal-header/canal-header.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Canal } from 'src/app/core/services/canal.service';

@Component({
  selector: 'app-canal-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-header.component.html',
  styleUrls: ['./canal-header.component.scss']
})
export class CanalHeaderComponent {
  @Input() canal!: Canal;
  @Input() subcanalesActivos: number = 0;
  @Input() subcanalesInactivos: number = 0;
  @Input() planesActivos: number = 0;
  @Input() planesInactivos: number = 0;
  @Input() totalOperaciones: number = 0;

  @Output() toggleEstado = new EventEmitter<void>();

  // Control de previsualización de imagen
  showImagePreview: boolean = false;

  constructor() { }

  onToggleEstado(): void {
    this.toggleEstado.emit();
  }

  // Método para mostrar la previsualización
  onImageClick(): void {
    if (this.canal && this.canal.foto) {
      this.showImagePreview = true;
      // Evitar scroll del body mientras el modal está abierto
      document.body.style.overflow = 'hidden';
    }
  }

  // Método para cerrar la previsualización
  closeImagePreview(): void {
    this.showImagePreview = false;
    // Restaurar scroll del body
    document.body.style.overflow = '';
  }
}
