// Archivo: src/app/pages/canales/components/canal-ubicacion/canal-ubicacion.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Canal } from 'src/app/core/services/canal.service';
import { UbicacionSelectorComponent } from 'src/app/shared/components/ubicacion-selector/ubicacion-selector.component';

@Component({
  selector: 'app-canal-ubicacion',
  standalone: true,
  imports: [CommonModule, UbicacionSelectorComponent],
  templateUrl: './canal-ubicacion.component.html',
  styleUrls: ['./canal-ubicacion.component.scss']
})
export class CanalUbicacionComponent {
  @Input() canal!: Canal;
  @Input() isEditing: boolean = false;
  @Input() canalFormData: any = {};

  @Output() toggleEdit = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() fieldChange = new EventEmitter<{field: string, value: any}>();
  @Output() provinciaChange = new EventEmitter<{id: string, nombre: string}>();
  @Output() localidadChange = new EventEmitter<{id: string, nombre: string}>();

  constructor() { }

  onToggleEdit(): void {
    this.toggleEdit.emit();
  }

  onSave(): void {
    this.saveChanges.emit();
  }

  onCancel(): void {
    this.cancelEdit.emit();
  }

  updateField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    this.fieldChange.emit({field, value: target.value});
  }

  onProvinciaChange(provincia: {id: string, nombre: string}): void {
    this.provinciaChange.emit(provincia);
  }

  onLocalidadChange(localidad: {id: string, nombre: string}): void {
    this.localidadChange.emit(localidad);
  }
}
