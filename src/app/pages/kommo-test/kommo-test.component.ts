import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KommoLeadService } from 'src/app/core/services/kommo-lead.service';
import { KommoService } from 'src/app/core/services/kommo.service';

@Component({
  selector: 'app-kommo-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2>Prueba de Kommo</h2>

      <div *ngIf="!kommoConnected" class="alert alert-warning">
        No hay conexión con Kommo. Por favor conéctate primero.
      </div>

      <div *ngIf="kommoConnected">
        <p>Conectado a Kommo</p>
        <button class="btn btn-primary" (click)="testCreateLead()">
          Crear Lead de Prueba
        </button>
      </div>

      <div *ngIf="loading" class="mt-3">
        <div class="spinner-border text-primary"></div>
        <span class="ms-2">Procesando...</span>
      </div>

      <div *ngIf="result" class="mt-3">
        <h3>Resultado:</h3>
        <pre>{{ result | json }}</pre>
      </div>

      <div *ngIf="error" class="mt-3 alert alert-danger">
        <h3>Error:</h3>
        <pre>{{ error | json }}</pre>
      </div>
    </div>
  `
})
export class KommoTestComponent {
  kommoConnected = false;
  loading = false;
  result: any = null;
  error: any = null;

  constructor(
    private kommoLeadService: KommoLeadService,
    private kommoService: KommoService
  ) {
    this.kommoConnected = this.kommoService.isAuthenticated();

    // Mostrar información sobre la autenticación para depuración
    const authData = this.kommoService.getAuthData();
    console.log('Auth data:', authData ? {
      accessToken: authData.accessToken ? authData.accessToken.substring(0, 10) + '...' : null,
      expiresAt: authData.expires_at ? new Date(authData.expires_at).toISOString() : null,
      isValid: this.kommoConnected
    } : 'No hay datos de autenticación');
  }

  testCreateLead() {
    if (!this.kommoService.isAuthenticated()) {
      this.error = 'No hay autenticación con Kommo';
      return;
    }

    this.loading = true;
    this.result = null;
    this.error = null;

    // Datos de prueba simples
    const operacionPrueba = {
      id: 1,
      monto: 50000,
      meses: 12,
      tasa: 25,
      estado: 'Prueba'
    };

    const clientePrueba = {
      id: 1,
      nombre: 'Cliente',
      apellido: 'Prueba',
      email: 'cliente@test.com',
      telefono: '123456789'
    };

    this.kommoLeadService.crearLeadDesdeOperacion(operacionPrueba, clientePrueba)
      .subscribe({
        next: (response) => {
          this.result = response;
          this.loading = false;
          console.log('Lead creado exitosamente:', response);
        },
        error: (err) => {
          this.error = err.error || err.message || err;
          this.loading = false;
          console.error('Error al crear lead:', err);
        }
      });
  }
}
