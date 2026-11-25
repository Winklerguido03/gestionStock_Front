import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard-guard';

export const routes: Routes = [
    
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'inicio',
    canActivate: [authGuard],
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: '**', // Cualquier ruta inventada redirige al login
    redirectTo: 'login',
  },

];
