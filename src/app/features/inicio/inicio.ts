import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
        this.productosOriginales = [...data];
        this.ordenStock.set('defecto');

        // <-- Verifica que estas 2 líneas estén aquí adentro:
      this.categoriasFiltro.set([...new Set(data.map(p => p.nombreCategoria).filter(Boolean))].sort());
      this.proveedoresFiltro.set([...new Set(data.map(p => p.nombreProveedor).filter(Boolean))].sort());
      },
      error: (err) => {
        console.error('Error al traer productos:', err);
        this.error.set('No se pudieron cargar los productos.');
        this.cargando.set(false);
      },
    });
  }

//INGRESO Y EGRESO

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

//MODAL NUEVO PRODUCTO

// Listas para los <select> del modal de Nuevo Producto
listaCategorias: { idCategoria: number; nombreCategoria: string }[] = [];
listaProveedores: { idProveedor: number; nombreProveedor: string }[] = [];

// Estado del modal de Nuevo Producto
mostrarModalNuevo: boolean = false;
guardandoProducto: boolean = false;
errorNuevoProducto: string = '';

nuevoProducto = {
  nombreProducto: '',
  precioCompra: 0,
  precioVenta: 0,
  stock: 0,
  idCategoria: 0,
  idProveedor: 0
};

abrirModalNuevoProducto(): void {
  this.mostrarModalNuevo = true;
  this.errorNuevoProducto = '';
  this.nuevoProducto = {
    nombreProducto: '',
    precioCompra: 0,
    precioVenta: 0,
    stock: 0,
    idCategoria: 0,
    idProveedor: 0
  };

  // Carga categorías y proveedores desde el backend
  this.productoService.obtenerCategorias().subscribe(cats => this.listaCategorias = cats);
  this.productoService.obtenerProveedores().subscribe(provs => this.listaProveedores = provs);
}

cerrarModalNuevoProducto(): void {
  this.mostrarModalNuevo = false;
  this.errorNuevoProducto = '';
}

guardarNuevoProducto(): void {
  if (!this.nuevoProducto.nombreProducto.trim()) {
    this.errorNuevoProducto = 'Ingresa el nombre del producto.';
    return;
  }
  if (!this.nuevoProducto.idCategoria || !this.nuevoProducto.idProveedor) {
    this.errorNuevoProducto = 'Selecciona una categoría y un proveedor.';
    return;
  }
  if (this.nuevoProducto.precioCompra < 0 || this.nuevoProducto.precioVenta < 0 || this.nuevoProducto.stock < 0) {
    this.errorNuevoProducto = 'Los precios y el stock no pueden ser negativos.';
    return;
  }

  this.guardandoProducto = true;
  this.errorNuevoProducto = '';

  this.productoService.crearProducto({
    ...this.nuevoProducto,
    idCategoria: Number(this.nuevoProducto.idCategoria),
    idProveedor: Number(this.nuevoProducto.idProveedor)
  }).subscribe({
    next: () => {
      this.guardandoProducto = false;
      this.cerrarModalNuevoProducto();
      this.cargarProductos(); // Refresca la tabla al instante
    },
    error: (err) => {
      this.guardandoProducto = false;
      this.errorNuevoProducto = err.error?.message || 'Error al guardar el producto.';
    }
  });
}

//ORDENAR DE MAYOR A MENOR Y DE MENOR A MAYOR

productosOriginales: Producto[] = [];
ordenStock = signal<string>('defecto'); // 'defecto' | 'menor' | 'mayor'

cambiarOrdenStock(valor: string): void {
  this.ordenStock.set(valor);
  this.aplicarFiltrosYOrden();

  if (valor === 'menor') {
    this.productos.update(lista => [...lista].sort((a, b) => a.stock - b.stock));
  } else if (valor === 'mayor') {
    this.productos.update(lista => [...lista].sort((a, b) => b.stock - a.stock));
  } else {
    this.productos.set([...this.productosOriginales]);
  }
}

//BUSCAR PRODUCTO POR NOMBRE
textoBusqueda = signal<string>('');

buscarProducto(texto: string): void {
  this.textoBusqueda.set(texto);
  this.aplicarFiltrosYOrden();
}

private aplicarFiltrosYOrden(): void {
  let resultado = [...this.productosOriginales];

  // 1. Filtrar por nombre
  const termino = this.textoBusqueda().toLowerCase().trim();
  if (termino !== '') {
    resultado = resultado.filter(p =>
      p.nombreProducto.toLowerCase().includes(termino)
    );
  }

  // 2. Filtrar por categoría
  const cat = this.categoriaSeleccionada();
  if (cat !== '') {
    resultado = resultado.filter(p => p.nombreCategoria === cat);
  }

  // 3. Filtrar por proveedor
  const prov = this.proveedorSeleccionado();
  if (prov !== '') {
    resultado = resultado.filter(p => p.nombreProveedor === prov);
  }

  // 4. Ordenar por stock
  const orden = this.ordenStock();
  if (orden === 'menor') {
    resultado.sort((a, b) => a.stock - b.stock);
  } else if (orden === 'mayor') {
    resultado.sort((a, b) => b.stock - a.stock);
  }

  this.productos.set(resultado);
}

//FILTRO POR CATEGORIA Y PROVEEDOR

categoriaSeleccionada = signal<string>('');
proveedorSeleccionado = signal<string>('');

categoriasFiltro = signal<string[]>([]);
proveedoresFiltro = signal<string[]>([]);

filtrarPorCategoria(categoria: string): void {
  this.categoriaSeleccionada.set(categoria);
  this.aplicarFiltrosYOrden();
}

filtrarPorProveedor(proveedor: string): void {
  this.proveedorSeleccionado.set(proveedor);
  this.aplicarFiltrosYOrden();
}

limpiarFiltros(): void {
  this.textoBusqueda.set('');
  this.categoriaSeleccionada.set('');
  this.proveedorSeleccionado.set('');
  this.ordenStock.set('defecto');
  this.aplicarFiltrosYOrden();
}

}
