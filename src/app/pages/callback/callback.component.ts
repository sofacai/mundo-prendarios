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
    private kommoService: KommoService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];
      const referer = params['referer']; // Add this line to capture the referer

      if (code) {
        // Enviar mensaje a la ventana principal
        if (window.opener) {
          window.opener.postMessage({
            source: 'kommo_callback',
            code: code,
            accountDomain: referer // Add this line to pass the referer
          }, window.location.origin);
          // ...
        } else {
          this.processCode(code, referer); // Pass referer here
        }
      }
      // ...
    });
  }

  private processCode(code: string, accountDomain: string) {
    this.kommoService.exchangeCodeForToken(code, accountDomain).subscribe({
      next: (data) => {
        this.kommoService.saveAuthData(data);
        this.success = true;
        this.loading = false;

        // Redirigir después de unos segundos
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 3000);
      },
      error: (err) => {
        this.error = `Error al procesar la autorización: ${err.error?.error || err.status || 'Error desconocido'}`;
        this.loading = false;
      }
    });
  }
}
