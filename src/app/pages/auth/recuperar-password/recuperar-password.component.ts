import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule
  ]
})
export class RecuperarPasswordComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  recoverForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';

  // Número de WhatsApp del administrador
  private adminWhatsApp = '5491178561602';

  constructor() { }

  ngOnInit() {
    this.recoverForm = this.formBuilder.group({
      username: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.submitted = true;

    // Resetear mensajes
    this.error = '';
    this.success = '';

    if (this.recoverForm.invalid) {
      return;
    }

    this.loading = true;

    const username = this.recoverForm.get('username')?.value;

    try {
      // Mensaje corto y sin caracteres especiales
      const mensaje = "Recuperar contraseña para usuario: " + username;

      // URL simple
      const whatsappUrl = "https://wa.me/5491178561602?text=" + encodeURIComponent(mensaje);

      // Abrir en nueva pestaña
      window.open(whatsappUrl, '_blank');

      this.success = 'Se abrirá WhatsApp con tu solicitud.';
      this.recoverForm.reset();
      this.submitted = false;
    } catch (err) {
      this.error = 'No se pudo abrir WhatsApp. Por favor, contacte al administrador directamente.';
    }

    this.loading = false;
  }

  onNoRecuerdoUsuario(): void {
    // Resetear mensajes
    this.error = '';
    this.success = '';

    try {
      // Mensaje corto y sin caracteres especiales
      const mensaje = "Recuperar contraseña - No recuerdo mi usuario";

      // URL simple
      const whatsappUrl = "https://wa.me/5491178561602?text=" + encodeURIComponent(mensaje);

      // Abrir en nueva pestaña
      window.open(whatsappUrl, '_blank');

      this.success = 'Se abrirá WhatsApp con tu solicitud.';
    } catch (err) {
      this.error = 'No se pudo abrir WhatsApp. Por favor, contacte al administrador directamente.';
    }
  }
}
