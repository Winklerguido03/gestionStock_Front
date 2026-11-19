import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * NUEVO: redirección al login recordando a dónde quería ir el usuario
 * (/login?returnUrl=/perfil/12/seguidores). El login, al entrar, vuelve a esa URL.
 * Sin URL útil (vacía o "/") va al login a secas. La usan authGuard y roleGuard.
 */
export function redirigirALogin(router: Router, url: string | undefined): UrlTree {
  return url && url !== '/'
    ? router.createUrlTree(['/login'], { queryParams: { returnUrl: url } })
    : router.createUrlTree(['/login']);
}

// Protege las pantallas privadas
// EDITADO: recibe el estado de la navegación para mandar al login con returnUrl
export const authGuard: CanActivateFn = (_route, state) => {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  if (!isBrowser) return true; // En el servidor no evalúa localStorage

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Si tenía una sesión corrupta o token vencido, la limpiamos
  // EDITADO: limpiarSesion() en vez de logout(): logout() navega a /login y pisaría el returnUrl
  authService.limpiarSesion();
  return redirigirALogin(router, state?.url);
};

