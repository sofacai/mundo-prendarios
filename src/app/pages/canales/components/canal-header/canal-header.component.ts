import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Canal } from 'src/app/core/services/canal.service';

@Component({
  selector: 'app-canal-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  @Input() operacionesAprobadas: number = 0;

  @Output() toggleEstado = new EventEmitter<void>();
  @Output() saveTitularData = new EventEmitter<any>();

  // Control de previsualización de imagen
  showImagePreview: boolean = false;

  // Control de edición de titular
  isEditingTitular: boolean = false;
  titularForm: any = {
    nombreFantasia: '',
    titularNombreCompleto: '',
    titularTelefono: '',
    titularEmail: ''
  };

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['canal'] && this.canal) {
      // Actualizar el formulario con los datos actuales
      this.titularForm = {
        nombreFantasia: this.canal.nombreFantasia || '',
        titularNombreCompleto: this.canal.titularNombreCompleto || '',
        titularTelefono: this.canal.titularTelefono || '',
        titularEmail: this.canal.titularEmail || ''
      };
    }
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

  // Métodos para edición de titular
  toggleEditTitular(): void {
    this.isEditingTitular = true;
  }

  saveTitular(): void {
    this.saveTitularData.emit(this.titularForm);
    this.isEditingTitular = false;
  }

  cancelEditTitular(): void {
    // Restaurar valores originales
    this.titularForm = {
      nombreFantasia: this.canal.nombreFantasia || '',
      titularNombreCompleto: this.canal.titularNombreCompleto || '',
      titularTelefono: this.canal.titularTelefono || '',
      titularEmail: this.canal.titularEmail || ''
    };
    this.isEditingTitular = false;
  }
}
