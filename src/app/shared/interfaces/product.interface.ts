export interface Product {
  id?: string;
  fechaAlta: Date;
  nombreVendedor: string;
  nombreProducto: string;
  enlace: string;
  precioCompra: number;
  dineroRembolsado: number;
  ventaPublico: number;
  tienda: 'AMAZON' | 'MERCADO_LIBRE';
  resena: boolean;
  contacto: string;
}

  export interface ProductMetrics {
    totalProducts: number;
    pendingRefunds: number;
    completedRefunds: number;
    averagePrice: number;
  }