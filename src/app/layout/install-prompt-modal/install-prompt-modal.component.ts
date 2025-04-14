import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-install-prompt-modal',
  templateUrl: './install-prompt-modal.component.html',
  styleUrls: ['./install-prompt-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class InstallPromptModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<boolean>();

  instalar() {
    this.close.emit(true);
  }

  rechazar() {
    this.close.emit(false);
  }
}
