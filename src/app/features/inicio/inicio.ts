import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inicio',
  imports: [FormsModule],
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

// Variables para el formulario de movimiento
productoSeleccionado: Producto | null = null;
tipoMovimiento: 'INGRESO' | 'EGRESO' = 'INGRESO';
cantidadMovimiento: number = 1;
motivoMovimiento: string = '';
errorMovimiento: string = '';
guardandoMovimiento: boolean = false;

abrirMovimiento(producto: Producto, tipo: 'INGRESO' | 'EGRESO'): void {
  this.productoSeleccionado = producto;
  this.tipoMovimiento = tipo;
  this.cantidadMovimiento = 1;
  this.motivoMovimiento = '';
  this.errorMovimiento = '';
}

cerrarMovimiento(): void {
  this.productoSeleccionado = null;
  this.errorMovimiento = '';
}

confirmarMovimiento(): void {
  if (!this.productoSeleccionado) return;

  if (this.cantidadMovimiento <= 0) {
    this.errorMovimiento = 'La cantidad debe ser mayor a 0.';
    return;
  }

  if (this.tipoMovimiento === 'EGRESO' && this.cantidadMovimiento > this.productoSeleccionado.stock) {
    this.errorMovimiento = `No puedes sacar más de ${this.productoSeleccionado.stock} unidades.`;
    return;
  }

  this.guardandoMovimiento = true;
  this.errorMovimiento = '';

  this.productoService.registrarMovimiento({
    idProducto: this.productoSeleccionado.idProducto,
    tipo: this.tipoMovimiento,
    cantidad: this.cantidadMovimiento,
    motivo: this.motivoMovimiento
  }).subscribe({
    next: () => {
      this.guardandoMovimiento = false;
      this.cerrarMovimiento();
      this.cargarProductos(); // Refresca la tabla con el nuevo stock
    },
    error: (err) => {
      this.guardandoMovimiento = false;
      this.errorMovimiento = err.error?.message || 'Error al registrar el movimiento.';
    }
  });
}

// Listas para los <select> del modal de Nuevo Producto
listaCategorias: { idCategoria: number; nombreCategoria: string }[] = [];
listaProveedores: { idProveedor: number; nombreProveedor: string }[] = [];



}
