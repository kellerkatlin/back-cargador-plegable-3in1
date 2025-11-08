export interface ProductVariant {
  id: string;
  produto_id: string;
  activo: boolean;
  nombre: string;
  tamanio: string;
  color: string;
  stock: number;
  created_at: string;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  sku: string;
  precio: number;
  created_at: string;
  descuento_porcentaje: number;
  precio_oferta: number;
  oferta_activa: boolean;
  product_variants?: ProductVariant[];
}
