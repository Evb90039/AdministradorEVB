import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  doc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Movimiento } from '../features/nomina/movimiento.interface';

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  private readonly COLLECTION_NAME = 'movimientos';
  private movimientosUpdated = new BehaviorSubject<void>(undefined);
  movimientosUpdated$ = this.movimientosUpdated.asObservable();

  constructor(private firestore: Firestore) {}

  // Crear un nuevo movimiento
  async agregarMovimiento(movimiento: Omit<Movimiento, 'id'>): Promise<any> {
    try {
      const movimientosRef = collection(this.firestore, this.COLLECTION_NAME);
      const docRef = await addDoc(movimientosRef, {
        ...movimiento,
        fecha: new Date(movimiento.fecha),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      this.movimientosUpdated.next();
      return docRef;
    } catch (error) {
      console.error('Error adding movimiento:', error);
      throw error;
    }
  }

  // Obtener movimientos por fecha
  getMovimientosPorFecha(fecha: Date): Observable<Movimiento[]> {
    const movimientosRef = collection(this.firestore, this.COLLECTION_NAME);
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    const q = query(
      movimientosRef,
      where('fecha', '>=', inicio),
      where('fecha', '<=', fin),
      orderBy('fecha', 'desc')
    );
    
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          ...(doc.data() as Movimiento),
          id: doc.id,
          fecha: (doc.data() as any).fecha.toDate()
        }))
      )
    );
  }

  // Obtener total de ingresos por fecha
  getTotalIngresosPorFecha(fecha: Date): Observable<number> {
    return this.getMovimientosPorFecha(fecha).pipe(
      map(movimientos => 
        movimientos
          .filter(m => m.tipo === 'INGRESO')
          .reduce((total, m) => total + m.monto, 0)
      )
    );
  }

  // Obtener total de egresos por fecha
  getTotalEgresosPorFecha(fecha: Date): Observable<number> {
    return this.getMovimientosPorFecha(fecha).pipe(
      map(movimientos => 
        movimientos
          .filter(m => m.tipo === 'EGRESO')
          .reduce((total, m) => total + m.monto, 0)
      )
    );
  }

  // Obtener movimientos por cuenta
  getMovimientosPorCuenta(cuentaId: string): Observable<Movimiento[]> {
    const movimientosRef = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      movimientosRef,
      where('cuentaId', '==', cuentaId),
      orderBy('fecha', 'desc')
    );
    
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          ...(doc.data() as Movimiento),
          id: doc.id,
          fecha: (doc.data() as any).fecha.toDate()
        }))
      )
    );
  }

  // Eliminar un movimiento
  async eliminarMovimiento(movimientoId: string, cuentaId: string, monto: number, tipo: 'INGRESO' | 'EGRESO'): Promise<void> {
    try {
      const movimientoRef = doc(this.firestore, `${this.COLLECTION_NAME}/${movimientoId}`);
      await deleteDoc(movimientoRef);
      this.movimientosUpdated.next();
    } catch (error) {
      console.error('Error deleting movimiento:', error);
      throw error;
    }
  }
} 