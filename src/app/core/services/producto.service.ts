import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Producto } from '../models/producto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/productos';

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  registrarMovimiento(movimiento: {
  idProducto: number;
  tipo: 'INGRESO' | 'EGRESO';
  cantidad: number;
  motivo: string;
}): Observable<any> {
  return this.http.post('http://localhost:8080/api/v1/movimientos', movimiento);
}

obtenerCategorias(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:8080/api/v1/categorias');
}

obtenerProveedores(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:8080/api/v1/proveedores');
}

crearProducto(producto: {
  nombreProducto: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  idCategoria: number;
  idProveedor: number;
}): Observable<any> {
  return this.http.post('http://localhost:8080/api/v1/productos', producto);
}

}
