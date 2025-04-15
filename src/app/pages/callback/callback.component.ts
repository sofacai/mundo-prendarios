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
  styles: [`
    .callback-container {
      max-width: 600px;
      margin: 100px auto;
      padding: 2rem;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .spinner-border {
      display: inline-block;
      width: 3rem;
      height: 3rem;
      vertical-align: text-bottom;
      border: 0.25em solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spinner-border 0.75s linear infinite;
      color: #009ef7;
    }

    @keyframes spinner-border {
      to {
        transform: rotate(360deg);
      }
    }

    .alert {
      padding: 1rem;
      border-radius: 0.475rem;
      margin-top: 1rem;
    }

    .alert-danger {
      color: #f1416c;
      background-color: #fff5f8;
      border-color: #f1416c;
    }

    .alert-success {
      color: #50cd89;
      background-color: #e8fff3;
      border-color: #50cd89;
    }
  `]
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

      if (error) {
        this.error = `Error de autorización: ${error}`;
        this.loading = false;
        return;
      }

      if (!code) {
        this.error = 'No se recibió código de autorización';
        this.loading = false;
        return;
      }

      this.processCode(code);
    });
  }

  private processCode(code: string) {
    this.kommoService.exchangeCodeForToken(code).subscribe({
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
        this.error = 'Error al procesar la autorización: ' + (err.error?.error || 'Error desconocido');
        this.loading = false;
      }
    });
  }
}
