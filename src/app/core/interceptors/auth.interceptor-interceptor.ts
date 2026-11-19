import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { catchError, throwError } from 'rxjs';

export const authInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(authService);
 // 1. Verificación de URL propia y endpoints públicos de autenticación
  const esApiPropia = req.url.startsWith(environment.apiUrl);

  // Tu API_URL en el servicio es `${environment.apiUrl}/auth`
  const esPublicUrl = req.url.includes('/auth/login');

  const token = authService.token();

  let peticion = req;

  if (esApiPropia && !esPublicUrl && token) {
    // 2. Validación preventiva en el cliente antes de consumir red
    if (isTokenExpired(token)) {
      authService.logout(); // Limpia storage, resetea signals y redirige a /login
      return throwError(() => new Error('Sesión expirada. Por favor vuelva a iniciar sesión.'));
    }

    // 3. Inyección del token Bearer en el header
    peticion = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 4. Captura de error 401 del servidor backend
  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && esApiPropia && !esPublicUrl && !esValidacionDeCredenciales(req.url)) {
        authService.logout(); // Limpia storage, resetea signals y redirige a /login
      }
      return throwError(() => err);
    })
  );
};
