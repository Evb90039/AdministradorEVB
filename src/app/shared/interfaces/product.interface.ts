export interface Product {
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