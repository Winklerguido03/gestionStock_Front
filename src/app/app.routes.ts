import { Routes } from '@angular/router';

export const routes: Routes = [
     // Ruta raíz: redirige al inicio/dashboard
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
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
  },

];
