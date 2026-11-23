import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto';

@Component({
  selector: 'app-inicio',
  imports: [],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit{

    private productoService = inject(ProductoService);

  productos = signal<Producto[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando.set(true);
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al traer productos:', err);
        this.error.set('No se pudieron cargar los productos.');
        this.cargando.set(false);
      },
    });
  }

}
