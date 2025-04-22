export interface Movimiento {
    id?: string;
    fecha: Date;
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    descripcion: string;
    cuentaId: string;
    cuentaNombre: string;
    createdAt?: Date;
    updatedAt?: Date;
} 