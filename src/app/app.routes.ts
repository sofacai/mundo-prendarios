import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RolType } from './core/models/usuario.model';
import { WizardContainerComponent } from './pages/cotizador/wizard-container/wizard-container.component';
import { SubcanalDetalleComponent } from './pages/subcanales/subcanal-detalle/subcanal-detalle.component';
import { UsuarioDetalleComponent } from './pages/usuarios/usuario-detalle/usuario-detalle.component';
import { OperacionDetalleComponent } from './pages/operaciones/operacion-detalle/operacion-detalle.component';
import { ProfilePageComponent } from './pages/profile/profile-page/profile-page.component';
import { KommoTestComponent } from './pages/kommo-test/kommo-test.component';

export const routes: Routes = [
  // Rutas públicas
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },



  // Rutas protegidas
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard/dashboard.component').then(m => m.DashboardWelcomeComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'usuarios/:id',
    component: UsuarioDetalleComponent,
    data: { roles: [RolType.Administrador, RolType.OficialComercial, RolType.AdminCanal] } },

  { path: 'subcanales/:id',
    component: SubcanalDetalleComponent,
    data: { roles: [RolType.Administrador, RolType.OficialComercial, RolType.AdminCanal] } },


  // Nuevas rutas
  {
    path: 'canales',
    loadComponent: () => import('./pages/canales/canales-lista/canales-lista.component').then(m => m.CanalesListaComponent),
    canActivate: [AuthGuard],
    data: { roles: [RolType.Administrador, RolType.OficialComercial] }
  },
  {
    path: 'canales/:id',
    loadComponent: () => import('./pages/canales/canal-detalle/canal-detalle.component').then(m => m.CanalDetalleComponent),
    canActivate: [AuthGuard],
    data: { roles: [RolType.Administrador, RolType.OficialComercial] }
  },
  {
    path: 'subcanales',
    loadComponent: () => import('./pages/subcanales/subcanales-lista/subcanales-lista.component').then(m => m.SubcanalesListaComponent),
    canActivate: [AuthGuard],
    data: { roles: [RolType.Administrador, RolType.OficialComercial, RolType.AdminCanal] }
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios-lista/usuarios-lista.component').then(m => m.UsuariosListaComponent),
    canActivate: [AuthGuard],
    data: { roles: [RolType.Administrador, RolType.AdminCanal, RolType.OficialComercial] }
  },

  {
    path: 'operaciones',
    loadComponent: () => import('./pages/operaciones/operaciones-lista/operaciones-lista.component').then(m => m.OperacionesListaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'planes',
    loadComponent: () => import('./pages/planes/planes-lista/planes-lista.component').then(m => m.PlanesListaComponent),
    canActivate: [AuthGuard],
    data: { roles: [RolType.Administrador] }
  },
  {
    path: 'cotizador',
    component: WizardContainerComponent,
    canActivate: [AuthGuard] // Si tienes un guard
  },
  {
    path: 'operaciones/:id',
    component: OperacionDetalleComponent,
  },
  {
    path: 'profile/:id',
    component: ProfilePageComponent,
  },
  {
    path: 'callback',
    loadComponent: () => import('./pages/callback/callback.component').then(m => m.CallbackComponent)
  },
  {
    path: 'test',
    loadComponent: () => import('./pages/kommo-test/kommo-test.component').then(m => m.KommoTestComponent)
  },

  // Redirecciones
  {
    path: '',
    redirectTo: 'pages/operaciones',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'operaciones'
  }
];
