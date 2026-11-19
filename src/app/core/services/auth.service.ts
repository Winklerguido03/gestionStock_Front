// src/app/core/services/auth.service.ts
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  UsuarioCreateRequest,
  VerificarCuentaResponse,
} from '../models/auth.model';
import { JwtPayload } from '../../core/models/jwt-payload.model';
import { Role, User } from '../../core/models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ── Dependencias ────────────────────────────────────────────
  private http        = inject(HttpClient);
  private router      = inject(Router);

  // ✅ isPlatformBrowser: evita errores si la app corre en SSR (Angular Universal)
  private esBrowser   = isPlatformBrowser(inject(PLATFORM_ID));

  // ── Constantes ───────────────────────────────────────────────
  private readonly API_URL   = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'rcc_token';
  private readonly USER_KEY  = 'rcc_user';

  // ── Signals de estado ────────────────────────────────────────
  public token       = signal<string | null>(this.leerStorage(this.TOKEN_KEY));
  public currentUser = signal<User | null>(this.getUserFromStorage());

  // ── Signals computados (solo lectura, derivados automáticamente) ──
  public isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  public userRole        = computed(() => this.currentUser()?.role ?? null);

  // ── API pública ──────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(tap(res => this.saveSession(res.token)));
  }

  // ── Registro ──
  // EDITADO: ya no inicia sesión. El back crea la cuenta sin verificar y manda un correo con el
  // enlace de verificación; hasta que se use, el login responde 403. Por eso se ignora el token
  // que todavía devuelve el registro y la pantalla pide verificar el correo.

  registrarUsuario(datos: UsuarioCreateRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register/usuario`, datos);
  }

  // ── NUEVO: verificación del correo (endpoint público, destino del enlace del correo) ──
  // GET /auth/verify-account?token=... → 200 { message } | 400 si el token no existe o venció.

  verificarCuenta(token: string): Observable<VerificarCuentaResponse> {
    return this.http.get<VerificarCuentaResponse>(`${this.API_URL}/verify-account`, {
      params: { token },
    });
  }

  /**
   * EDITADO: `destino` permite elegir a dónde ir. Por defecto /login (lo usan los
   * interceptores cuando el token vence); el "Cerrar sesión" del usuario va a /inicio.
   */
  logout(destino: string = '/login'): void {
    this.limpiarSesion(); // EDITADO: la limpieza pasó a limpiarSesion()
    this.router.navigate([destino]);
  }

  /**
   * NUEVO: borra la sesión (token y usuario) SIN navegar. La usan los guards: ellos mismos
   * redirigen a /login?returnUrl=... y una navegación extra de logout() pisaría esa redirección.
   */
  limpiarSesion(): void {
    this.borrarStorage(this.TOKEN_KEY);
    this.borrarStorage(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  // Acepta array para compatibilidad con guards y directiva HasRole
  hasRole(requiredRoles: Role[]): boolean {
    const role = this.userRole();
    return role ? requiredRoles.includes(role) : false;
  }

  // Accesos directos a los claims — útiles en templates y componentes
  getEmail(): string | null  { return this.getPayload()?.sub  ?? null; }
  getNombre(): string | null { return this.getPayload()?.name ?? null; }
  getRol(): string | null { return this.userRole() ?? null;}
  getId(): number | null     { return this.getPayload()?.id   ?? null; }

  // ── Métodos privados ─────────────────────────────────────────

  private saveSession(token: string): void {
    const user = this.buildUserFromToken(token);
    if (!user) throw new Error('Token JWT inválido o malformado');

    this.guardarStorage(this.TOKEN_KEY, token);
    this.guardarStorage(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private getUserFromStorage(): User | null {
    try {
      const raw = this.leerStorage(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      // Si el JSON está corrupto, limpiar y forzar nuevo login
      this.borrarStorage(this.USER_KEY);
      return null;
    }
  }

  // ✅ Construye el objeto User desde el payload del JWT
  private buildUserFromToken(token: string): User | null {
    const payload = this.getPayload(token);
    if (!payload) return null;
    return {
      id:       payload.id,
      username: payload.sub,    // "sub": "grupo@gmail.com"
      role:     payload.rol as Role,    // "rol": "GRUPO"
    };
  }

  // ✅ decodeURIComponent + encodeURIComponent: soporta caracteres Unicode (tildes, ñ, etc.)
  // ✅ No verifica la firma — eso lo hace el backend en cada request
  private getPayload(token?: string): JwtPayload | null {
    const jwt = token ?? this.token();
    if (!jwt) return null;
    try {
      const base64 = jwt.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  // ── Helpers de localStorage seguros para SSR ─────────────────

  private leerStorage(key: string): string | null {
    return this.esBrowser ? localStorage.getItem(key) : null;
  }

  private guardarStorage(key: string, value: string): void {
    if (this.esBrowser) localStorage.setItem(key, value);
  }

  private borrarStorage(key: string): void {
    if (this.esBrowser) localStorage.removeItem(key);
  }
}
