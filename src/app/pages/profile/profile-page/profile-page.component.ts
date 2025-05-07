import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { UsuarioService, UsuarioDto, UsuarioCrearDto } from 'src/app/core/services/usuario.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { Usuario } from 'src/app/core/models/usuario.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent
  ],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy, AfterViewInit {
  currentUser: Usuario | null = null;
  usuario: UsuarioDto | null = null;
  usuarioForm: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    password: string;
    confirmarPassword: string;
    rolId: number;
  } | null = null;
  loading = true;
  error: string | null = null;
  editMode = false;

  // Propiedades para instalar la PWA
  deferredPrompt: any = null;
  isInstallable: boolean = false;

  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router,
    private sidebarStateService: SidebarStateService,
  ) {
    // Escuchar el evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;

    if (this.currentUser) {
      this.loadUserDetails(this.currentUser.id);
    } else {
      this.error = 'Usuario no encontrado';
      this.loading = false;
    }

    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        this.isSidebarCollapsed = collapsed;
        this.adjustContentArea();
      }
    );
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  private adjustContentArea() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      contentArea.style.marginLeft = this.isSidebarCollapsed ? '70px' : '260px';
    }
  }

  loadUserDetails(userId: number) {
    this.loading = true;
    this.usuarioService.getUsuario(userId).subscribe({
      next: (data) => {
        this.usuario = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del perfil';
        this.loading = false;
      }
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;

    if (this.editMode && this.usuario) {
      this.usuarioForm = {
        nombre: this.usuario.nombre,
        apellido: this.usuario.apellido,
        email: this.usuario.email,
        telefono: this.usuario.telefono || '',
        password: '',
        confirmarPassword: '',
        rolId: this.usuario.rolId
      };
    }
  }

  saveProfile() {
    if (!this.usuario || !this.usuarioForm) return;

    if (this.usuarioForm.password) {
      if (this.usuarioForm.password !== this.usuarioForm.confirmarPassword) {
        this.error = 'Las contraseñas no coinciden';
        return;
      }
    }

    this.loading = true;
    this.error = null;

    const updateData: UsuarioCrearDto = {
      nombre: this.usuarioForm.nombre,
      apellido: this.usuarioForm.apellido,
      email: this.usuario.email,
      telefono: this.usuarioForm.telefono,
      password: this.usuarioForm.password || '',
      rolId: this.usuario.rolId,
      creadorId: this.usuario.creadorId || this.currentUser?.id || 0
    };

    this.usuarioService.updateUsuario(this.usuario.id, updateData).subscribe({
      next: (data) => {
        if (this.usuario) {
          this.usuario.nombre = updateData.nombre;
          this.usuario.apellido = updateData.apellido;
          this.usuario.telefono = updateData.telefono;
        }

        this.editMode = false;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al guardar los cambios';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/subcanales']);
  }

  cancelEdit() {
    this.editMode = false;
    if (this.usuario) {
      this.loadUserDetails(this.usuario.id);
    }
  }

  // Método para instalar la PWA
  installApp() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuario instaló la app');
      }
      this.deferredPrompt = null;
      this.isInstallable = false;
    });
  }

  private generateRandomState(): string {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('kommo_state', state);
    return state;
  }
}
