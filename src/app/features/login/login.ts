import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ApiError } from '../../core/interceptors/error.interceptor-interceptor';
import { LoginRequest } from '../../core/models/auth.model';
import { finalize } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
     private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals para reactividad local
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  // Formulario fortemente tipado con nonNullable
  public form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.email]],
    // EDITADO: sin mínimo de largo. Cambiar/restablecer contraseña aceptan 6 caracteres,
    // así que exigir 8 acá dejaba afuera a esas cuentas. La validez la decide el back.
    password: ['', [Validators.required]],
  });

  // Getters para facilitar lectura en la plantilla
  get username() {
    return this.form.controls.username;
  }
  get password() {
    return this.form.controls.password;
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Usamos getRawValue() para obtener el objeto LoginRequest tipado directamente
    const credentials: LoginRequest = this.form.getRawValue();

    this.authService
      .login(credentials)
      .pipe(
        finalize(() => this.isLoading.set(false)), // Asegura apagar el spinner/estado cargando
      )
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const destino =
            returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/inicio';
          this.router.navigateByUrl(destino);
        },
        error: (err: ApiError) => {
          this.errorMessage.set(this.obtenerMensajeError(err));
        },
      });
  }

  private obtenerMensajeError(err: ApiError): string {
    // EDITADO: el back responde 401 si el correo o la contraseña no coinciden, y 403 si la cuenta
    // todavía no verificó el correo (antes se mostraba "contraseña incorrecta" para los dos).
    if (err.status === 401) {
      return 'Correo o contraseña incorrectos.';
    }
    if (err.status === 403) {
      return 'Todavía no verificaste tu correo. Abrí el enlace que te enviamos al registrarte (revisá también la carpeta de spam).';
    }
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Revisá tu conexión.';
    }
    return err.error?.message || 'Ocurrió un error inesperado. Intentá de nuevo.';
  }
}
