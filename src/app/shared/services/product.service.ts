// src/app/shared/services/product.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly collectionName = 'products';

  constructor(private firestore: Firestore) {}

  // Crear un nuevo producto
  createProduct(product: Product): Observable<Product> {
    const productData = {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
      fechaAlta: new Date(product.fechaAlta)
    };

    const productsRef = collection(this.firestore, this.collectionName);
    
    return from(addDoc(productsRef, productData)).pipe(
      map(docRef => ({
        ...productData,
        id: docRef.id
      }))
    );
  }
  // Obtener todos los productos
  getProducts(): Observable<Product[]> {
    const productsRef = collection(this.firestore, this.collectionName);
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          ...(doc.data() as Product),
          id: doc.id
        }))
      )
    );
  }
  // Actualizar un producto
  updateProduct(id: string, product: Partial<Product>): Observable<void> {
    const productRef = doc(this.firestore, `${this.collectionName}/${id}`);
    const updateData = {
      ...product,
      updatedAt: new Date()
    };
    
    return from(updateDoc(productRef, updateData));
  }

  // Eliminar un producto
  deleteProduct(id: string): Observable<void> {
    const productRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(deleteDoc(productRef));
  }
}