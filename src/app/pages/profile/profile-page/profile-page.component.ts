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
import { KommoService } from 'src/app/core/services/kommo.service';

declare global {
  interface Window {
    KommoButton: any;
  }
}

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
  kommoConnected = false;

  private readonly KOMMO_CLIENT_ID = 'a279e4b2-6bf6-4596-a574-ff524ac1f895';
  private readonly KOMMO_REDIRECT_URI = 'http://localhost:8100/callback';


  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router,
    private sidebarStateService: SidebarStateService,
    private kommoService: KommoService
  ) { }

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

    this.kommoConnected = this.kommoService.isAuthenticated();
  }

  ngAfterViewInit() {
    if (!this.kommoConnected) {
      this.loadKommoButtonScript();
    }
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

  // Métodos para integración con Kommo
  private loadKommoButtonScript() {
    if (document.getElementById('kommo-button-script')) {
      this.initKommoButton();
      return;
    }

    const script = document.createElement('script');
    script.id = 'kommo-button-script';
    script.src = 'https://cdn.kommo.com/widgets/button/v2/button.js';
    script.async = true;
    script.onload = () => {
      this.initKommoButton();
    };
    document.body.appendChild(script);
  }

  private initKommoButton() {
    if (!window.KommoButton || !document.getElementById('kommo-button-container')) {
      return;
    }

    const kommoButton = new window.KommoButton({
      clientId: this.KOMMO_CLIENT_ID,
      redirectUri: this.KOMMO_REDIRECT_URI,
      title: 'Conectar con Kommo',
      container: document.getElementById('kommo-button-container'),
      onAuth: (code: string) => {
        this.handleKommoAuth(code);
      }
    });
  }

  private handleKommoAuth(code: string) {
    this.loading = true;
    this.kommoService.exchangeCodeForToken(code).subscribe({
      next: (data) => {
        this.kommoService.saveAuthData(data);
        this.kommoConnected = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al conectar con Kommo: ' + (err.error?.error || 'Error desconocido');
        this.loading = false;
      }
    });
  }

  disconnectKommo() {
    this.kommoService.clearAuthData();
    this.kommoConnected = false;

    // Recargar el botón de Kommo
    setTimeout(() => {
      this.loadKommoButtonScript();
    }, 100);
  }
  connectKommo() {
    const authUrl = `https://api-c.kommo.com/oauth/authorize?client_id=${this.KOMMO_CLIENT_ID}&redirect_uri=${encodeURIComponent(this.KOMMO_REDIRECT_URI)}&response_type=code&state=${this.generateRandomState()}`;

    window.open(authUrl, '_blank', 'width=800,height=600');
  }

  private generateRandomState(): string {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('kommo_state', state);
    return state;
  }
}
