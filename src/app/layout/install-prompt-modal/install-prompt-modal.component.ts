import { Component } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-install-prompt-modal',
  templateUrl: './install-prompt-modal.component.html',
  styleUrls: ['./install-prompt-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule] // 👈 necesario para los <ion-*>
})
export class InstallPromptModalComponent {

  constructor(private modalCtrl: ModalController) {}

  instalar() {
    this.modalCtrl.dismiss({ instalar: true });
  }

  rechazar() {
    this.modalCtrl.dismiss({ instalar: false });
  }
}
