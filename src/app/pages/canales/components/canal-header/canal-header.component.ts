import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Canal } from 'src/app/core/services/canal.service';

@Component({
  selector: 'app-canal-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-header.component.html',
  styleUrls: ['./canal-header.component.scss']
})
export class CanalHeaderComponent implements OnChanges {
  @Input() canal!: Canal;
  @Input() subcanalesActivos: number = 0;
  @Input() subcanalesInactivos: number = 0;
  @Input() planesActivos: number = 0;
  @Input() planesInactivos: number = 0;
  @Input() totalOperaciones: number = 0;
  @Input() operacionesLiquidadas: number = 0;
  @Input() operacionesAprobadas: number = 0; // Nueva propiedad

  @Output() toggleEstado = new EventEmitter<void>();

  // Control de previsualización de imagen
  showImagePreview: boolean = false;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    // Este componente solo recibe valores ya calculados
  }

  onToggleEstado(): void {
    this.toggleEstado.emit();
  }

  // Método para mostrar la previsualización
  onImageClick(): void {
    if (this.canal && this.canal.foto) {
      this.showImagePreview = true;
      document.body.style.overflow = 'hidden';
    }
  }

  // Método para cerrar la previsualización
  closeImagePreview(): void {
    this.showImagePreview = false;
    document.body.style.overflow = '';
  }
}
