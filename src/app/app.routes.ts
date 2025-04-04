import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RolType } from './core/models/usuario.model';
import { WizardContainerComponent } from './pages/cotizador/wizard-container/wizard-container.component';
import { SubcanalDetalleComponent } from './pages/subcanales/subcanal-detalle/subcanal-detalle.component';
import { UsuarioDetalleComponent } from './pages/usuarios/usuario-detalle/usuario-detalle.component';

export const routes: Routes = [
  // Rutas públicas
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'pages/home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },


  // Rutas protegidas
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },

  {
    path: 'usuarios/:id',
    component: UsuarioDetalleComponent,
    data: { roles: [RolType.Administrador, RolType.OficialComercial, RolType.AdminCanal] } },

  { path: 'subcanales/:id',
    component: SubcanalDetalleComponent,
    data: { roles: [RolType.Administrador, RolType.OficialComercial] } },


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
    data: { roles: [RolType.Administrador, RolType.OficialComercial] }
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios-lista/usuarios-lista.component').then(m => m.UsuariosListaComponent),
    canActivate: [AuthGuard],
    data: { roles: [RolType.Administrador, RolType.AdminCanal, RolType.OficialComercial] }
  },
  {
    path: 'clientes',
    loadComponent: () => import('./pages/clientes/clientes-lista/clientes-lista.component').then(m => m.ClientesListaComponent),
    canActivate: [AuthGuard],
    data: { roles: [RolType.Administrador, RolType.OficialComercial] }
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

  // Redirecciones
  {
    path: '',
    redirectTo: 'pages/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
