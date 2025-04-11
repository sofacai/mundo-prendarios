import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { first } from 'rxjs/operators';
import { RolType } from '../../../core/models/usuario.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { ModalController, Platform, IonicModule } from '@ionic/angular';
import { InstallPromptModalComponent } from 'src/app/layout/install-prompt-modal/install-prompt-modal.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    IonicModule
  ]
})
export class LoginComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private platform = inject(Platform);

  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  showPassword = false;

  private deferredPrompt: any;

  constructor() {
    if (this.router.url === '/auth/login') {
      this.authService.logout();
    }
    else if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      if (
        isStandalone ||
        localStorage.getItem('installPromptDismissed') === 'true'
      ) return;

      const isMobile = this.platform.is('android') || this.platform.is('ios');
      if (!isMobile) return;

      this.deferredPrompt = e;
      this.showInstallModal();
    });
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
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
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

  private async showInstallModal() {
    const presentingEl = document.querySelector('ion-router-outlet');

    const modal = await this.modalCtrl.create({
      component: InstallPromptModalComponent,
      backdropDismiss: false,
      showBackdrop: true,
      animated: true,
      cssClass: 'install-modal-custom',
      presentingElement: presentingEl ?? undefined
    });

    await modal.present();

    // 🔥 Esperamos al siguiente ciclo para acceder al DOM del modal
    setTimeout(() => {
      const ionModalEl = document.querySelector('ion-modal');
      const appModalEl = ionModalEl?.shadowRoot?.querySelector('ion-content, .ion-page');

      if (appModalEl) {
        (appModalEl as HTMLElement).style.background = 'transparent';
      }

      const wrapper = ionModalEl?.shadowRoot?.querySelector('.modal-wrapper');
      if (wrapper) {
        (wrapper as HTMLElement).style.background = 'transparent';
      }
    }, 50);

    modal.onDidDismiss().then(async ({ data }) => {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('width');

      if (data?.instalar && this.deferredPrompt) {
        this.deferredPrompt.prompt();
        await this.deferredPrompt.userChoice;
      }

      localStorage.setItem('installPromptDismissed', 'true');
    });
  }

}
