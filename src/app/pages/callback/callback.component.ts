import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KommoService } from 'src/app/core/services/kommo.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div *ngIf="loading" class="text-center p-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-2">Procesando autorización...</p>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <div *ngIf="success" class="alert alert-success">
        <i class="bi bi-check-circle me-2"></i>
        Conectado con éxito a Kommo.
      </div>
    </div>
  `,
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent implements OnInit {
  loading = true;
  error: string | null = null;
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private KommoService: KommoService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log('Callback params:', params); // Depuración

      const code = params['code'];
      const error = params['error'];
      const referer = params['referer']; // Este es el nombre completo, ej: subdomain.kommo.com
      const clientId = params['client_id'];
      const state = params['state'];

      // Mostrar todos los parámetros recibidos para depuración
      console.log(`Code: ${code}, Referer: ${referer}, ClientId: ${clientId}, State: ${state}`);

      if (code) {
        // Enviar el referer completo sin modificar
        if (window.opener) {
          window.opener.postMessage({
            source: 'kommo_callback',
            code: code,
            accountDomain: referer, // Pasar el referer completo
            clientId: clientId,
            state: state
          }, window.location.origin);
          window.close(); // Cerrar la ventana popup
        } else {
          this.processCode(code, referer);
        }
      } else if (error) {
        this.error = `Error de autorización: ${error}`;
        this.loading = false;
      }
    });
  }

  private processCode(code: string, accountDomain: string) {
    console.log(`Procesando código: ${code}, Domain: ${accountDomain}`);

    this.KommoService.exchangeCodeForToken(code, accountDomain).subscribe({
      next: (data) => {
        this.KommoService.saveAuthData(data);
        this.success = true;
        this.loading = false;

        // Redirigir después de unos segundos
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 3000);
      },
      error: (err) => {
        console.error('Error en exchangeCodeForToken:', err);
        this.error = `Error al procesar la autorización: ${err.error?.error || err.status || 'Error desconocido'}`;
        this.loading = false;
      }
    });
  }
}
