import { Component, signal } from '@angular/core';

interface ProductoMayorStock {
  nombre: string;
  stock: number;
}

@Component({
  selector: 'app-inicio',
  imports: [],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {

    totalProductos = signal<number>(0);
  totalCategorias = signal<number>(0);
  totalProveedores = signal<number>(0);
  stockTotal = signal<number>(0);
  productosSinStock = signal<number>(0);
  productosConStock = signal<number>(0);
  productoMayorStock = signal<ProductoMayorStock | null>(null);

}
