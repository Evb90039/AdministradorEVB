import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  addDoc, 
  updateDoc,
  doc,
  query,
  where,
  deleteDoc 
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface Cita {
  id?: string;
  pacienteId: string;
  nombrePaciente: string;
  fecha: Date;
  monto: number;
  pagado: boolean;
  telefono: string;
}

export interface ResumenPaciente {
  citasPendientesPago: number;
  totalCitas: number;
  montoPendiente: number;
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  constructor(private firestore: Firestore) {}

  getCitas(): Observable<Cita[]> {
    const citasRef = collection(this.firestore, 'citas');
    return collectionData(citasRef, { idField: 'id' }).pipe(
      map(citas => citas.map(cita => ({
        ...cita,
        fecha: (cita['fecha'] as any)?.toDate() || new Date()
      })) as Cita[])
    );
  }

  getCitasPorPaciente(pacienteId: string): Observable<Cita[]> {
    const citasRef = collection(this.firestore, 'citas');
    const q = query(citasRef, where('pacienteId', '==', pacienteId));
    return collectionData(q, { idField: 'id' }).pipe(
      map(citas => citas.map(cita => ({
        ...cita,
        fecha: (cita['fecha'] as any)?.toDate() || new Date()
      })) as Cita[])
    );
  }

  getResumenPaciente(nombrePaciente: string): Observable<ResumenPaciente> {
    const citasRef = collection(this.firestore, 'citas');
    const q = query(citasRef, where('nombrePaciente', '==', nombrePaciente));
    
    return collectionData(q, { idField: 'id' }).pipe(
      map(citas => {
        const citasArray = citas as Cita[];
        const citasPendientes = citasArray.filter(cita => !cita.pagado);
        
        return {
          citasPendientesPago: citasPendientes.length,
          totalCitas: citasArray.length,
          montoPendiente: citasPendientes.reduce((total, cita) => total + (cita.monto || 0), 0)
        };
      })
    );
  }

  agregarCita(cita: Omit<Cita, 'id'>): Promise<any> {
    const citasRef = collection(this.firestore, 'citas');
    return addDoc(citasRef, {
      ...cita,
      fecha: new Date(cita.fecha)
    });
  }

  actualizarPago(citaId: string, pagado: boolean): Promise<void> {
    const citaRef = doc(this.firestore, 'citas', citaId);
    return updateDoc(citaRef, { pagado });
  }

  eliminarCita(citaId: string): Promise<void> {
    const citaRef = doc(this.firestore, 'citas', citaId);
    return deleteDoc(citaRef);
  }
}