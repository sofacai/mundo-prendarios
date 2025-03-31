// Archivo: src/app/pages/canales/components/canal-info-bancaria/canal-info-bancaria.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Canal } from 'src/app/core/services/canal.service';

@Component({
  selector: 'app-canal-info-bancaria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-info-bancaria.component.html',
  styleUrls: ['./canal-info-bancaria.component.scss']
})
export class CanalInfoBancariaComponent {
  @Input() canal!: Canal;
  @Input() isEditing: boolean = false;
  @Input() canalFormData: any = {};

  @Output() toggleEdit = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() fieldChange = new EventEmitter<{field: string, value: any}>();

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
    const target = event.target as HTMLInputElement;
    this.fieldChange.emit({field, value: target.value});
  }
}
