import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subcanal } from 'src/app/core/services/subcanal.service';

@Component({
  selector: 'app-subcanal-general-tab',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './subcanal-general-tab.component.html',
  styleUrls: ['./subcanal-general-tab.component.scss']
})
export class SubcanalGeneralTabComponent {
  @Input() subcanal!: Subcanal;
  @Input() isEditing = false;
  @Input() subcanalFormData: any = {};

  @Output() editingToggled = new EventEmitter<string>();
  @Output() saveSection = new EventEmitter<string>();
  @Output() cancelEditing = new EventEmitter<string>();
  @Output() updateField = new EventEmitter<{field: string, event: Event}>();

  toggleEditing() {
    this.editingToggled.emit('general');
  }

  onSaveSection() {
    this.saveSection.emit('general');
  }

  onCancelEditing() {
    this.cancelEditing.emit('general');
  }

  onUpdateField(field: string, event: Event) {
    this.updateField.emit({field, event});
  }
}
