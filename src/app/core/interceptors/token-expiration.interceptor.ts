import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class TokenExpirationInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Verificar si es un error 401 (Unauthorized) que indica token expirado
        if (error.status === 401) {

          // Verificar que el usuario esté logueado antes de hacer logout
          if (this.authService.isAuthenticated()) {
            // Limpiar la sesión y redirigir al login
            this.authService.logout();
          }

          // También podrías mostrar un mensaje al usuario
          // this.showTokenExpiredMessage();
        }

        // Propagar el error para que los componentes puedan manejarlo si es necesario
        return throwError(() => error);
      })
    );
  }

  // Método opcional para mostrar un mensaje al usuario
  private showTokenExpiredMessage(): void {
    // Puedes implementar aquí una notificación toast o modal
  }
}
