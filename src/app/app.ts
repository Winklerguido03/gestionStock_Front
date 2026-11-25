import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Login } from './features/login/login';
import { Header } from './shared/layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Front-End');
  constructor(private router: Router) {}

  mostrarHeader(): boolean {
    const url = this.router.url;
    // Oculta el header si está en /login (o en la ruta vacía '/' si redirige al login)
    return !url.includes('/login') && url !== '/';
  }
}
