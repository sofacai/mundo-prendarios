import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { first } from 'rxjs/operators';
import { RolType } from '../../../core/models/usuario.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule
  ]
})
export class LoginComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  showPassword = false;

  constructor() {
    if (this.router.url === '/auth/login') {
      this.authService.logout();
    }
    else if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const credentials = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(credentials)
      .pipe(first())
      .subscribe({
        next: () => {
          const userData = this.authService.currentUserValue;
          if (userData?.rolId === RolType.Administrador || userData?.rolId === RolType.AdminCanal) {
            this.router.navigate(['/operaciones']);
          } else {
            this.router.navigate(['/operaciones']);
          }
        },
        error: error => {
          this.error = error.message || 'Error en el inicio de sesión';
          this.loading = false;
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
