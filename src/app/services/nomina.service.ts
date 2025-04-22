import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from '@angular/fire/firestore';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Cuenta } from '../features/nomina/cuenta.interface';

@Injectable({
  providedIn: 'root'
})
export class NominaService {
  private readonly COLLECTION_NAME = 'cuentas';
  private cuentasUpdated = new BehaviorSubject<void>(undefined);
  cuentasUpdated$ = this.cuentasUpdated.asObservable();

  constructor(private firestore: Firestore) {
    this.checkAndInitializeCuentas();
  }

  private async checkAndInitializeCuentas() {
    try {
      console.log('Verificando colección de cuentas...');
      const cuentasRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(cuentasRef);
      const querySnapshot = await getDocs(q);

      console.log('Estado de la colección:', querySnapshot.empty ? 'Vacía' : 'Con datos');
      

    } catch (error) {
      console.error('Error checking cuentas:', error);
    }
  }

  getCuentas(): Observable<Cuenta[]> {
    console.log('Iniciando getCuentas...');
    const cuentasRef = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(cuentasRef, orderBy('nombre'));
    
    return from(getDocs(q)).pipe(
      map(snapshot => {
        console.log('Datos recibidos de Firestore:', snapshot.docs);
        return snapshot.docs.map(doc => ({
          ...(doc.data() as Cuenta),
          id: doc.id
        }));
      })
    );
  }

  async actualizarSaldo(cuentaId: string, saldo: number): Promise<void> {
    try {
      console.log('Actualizando saldo de cuenta:', cuentaId, saldo);
      const cuentaRef = doc(this.firestore, this.COLLECTION_NAME, cuentaId);
      await updateDoc(cuentaRef, { 
        saldo,
        updatedAt: new Date()
      });
      this.cuentasUpdated.next();
      console.log('Saldo actualizado exitosamente');
    } catch (error) {
      console.error('Error updating saldo:', error);
      throw error;
    }
  }

  async agregarCuenta(cuenta: Omit<Cuenta, 'id'>): Promise<any> {
    try {
      console.log('Agregando nueva cuenta:', cuenta);
      const cuentasRef = collection(this.firestore, this.COLLECTION_NAME);
      
      // Verificar si ya existe una cuenta con el mismo nombre
      const q = query(cuentasRef, where('nombre', '==', cuenta.nombre));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Ya existe una cuenta con ese nombre');
      }

      const docRef = await addDoc(cuentasRef, {
        ...cuenta,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      this.cuentasUpdated.next();
      console.log('Cuenta agregada exitosamente:', docRef.id);
      return docRef;
    } catch (error) {
      console.error('Error adding cuenta:', error);
      throw error;
    }
  }

  async eliminarCuenta(cuentaId: string): Promise<void> {
    try {
      console.log('Eliminando cuenta:', cuentaId);
      const cuentaRef = doc(this.firestore, this.COLLECTION_NAME, cuentaId);
      await deleteDoc(cuentaRef);
      this.cuentasUpdated.next();
      console.log('Cuenta eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting cuenta:', error);
      throw error;
    }
  }

  obtenerTotal(): Observable<number> {
    return this.getCuentas().pipe(
      map(cuentas => {
        const total = cuentas.reduce((sum, cuenta) => sum + (cuenta.saldo || 0), 0);
        console.log('Total calculado:', total);
        return total;
      })
    );
  }
} 