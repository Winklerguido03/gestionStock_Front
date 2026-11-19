import { Routes } from '@angular/router';

export const routes: Routes = [
     // Ruta raíz: redirige al inicio/dashboard
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // Login: protegido con guestGuard (si ya está logueado, redirige a /inicio)
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },

];
