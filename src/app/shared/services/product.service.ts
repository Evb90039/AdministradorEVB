// src/app/shared/services/product.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy} from '@angular/fire/firestore';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';
import { Interface } from 'node:readline';
import { ProductMetrics } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly collectionName = 'products';
  private productsUpdated = new BehaviorSubject<void>(undefined);
  productsUpdated$ = this.productsUpdated.asObservable();

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
      })),
      tap(() => this.productsUpdated.next())
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
    
    return from(updateDoc(productRef, updateData)).pipe(
      tap(() => this.productsUpdated.next())
    );
  }

  // Eliminar un producto
  deleteProduct(id: string): Observable<void> {
    const productRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return from(deleteDoc(productRef)).pipe(
      tap(() => this.productsUpdated.next())
    );
  }

  // Calcular el total de compras
  getTotalCompras(): Observable<number> {
    const productsRef = collection(this.firestore, this.collectionName);
    
    return from(getDocs(productsRef)).pipe(
      map(snapshot => 
        snapshot.docs.reduce((total, doc) => {
          const product = doc.data() as Product;
          return total + (product.precioCompra || 0);
        }, 0)
      )
    );
  }
    // Calcular el total de compras

    calcularFaltaRembolsar(): Observable<number> {
      const productsRef = collection(this.firestore, this.collectionName);
      
      return from(getDocs(productsRef)).pipe(
        map(snapshot => 
          snapshot.docs.reduce((total, doc) => {
            const product = doc.data() as Product;
            // Si dineroRembolsado es 0 o no existe, suma el precio de compra
            return (!product.dineroRembolsado) ? total + product.precioCompra : total;
          }, 0)
        )
      );
    }
    // Calcular el total de Vendido
  calcularVendido(): Observable<number> {
    const productsRef = collection(this.firestore, this.collectionName);
    
    return from(getDocs(productsRef)).pipe(
      map(snapshot => 
        snapshot.docs.reduce((total, doc) => {
          const product = doc.data() as Product;
          return total + (product.ventaPublico || 0);
        }, 0)
      )
    );
  }
  calcularGananciaTotal(): Observable<number> {
    const productsRef = collection(this.firestore, this.collectionName);
    
    return from(getDocs(productsRef)).pipe(
      map(snapshot => {
        let totalVendido = 0;
        let totalPorRembolsar = 0;
        
        snapshot.docs.forEach(doc => {
          const product = doc.data() as Product;
          totalVendido += (product.ventaPublico || 0);
          if (!product.dineroRembolsado) {
            totalPorRembolsar += product.precioCompra;
          }
        });
        
        return totalVendido - totalPorRembolsar;
      })
    );
  }
  getProductMetrics(): Observable<ProductMetrics> {
    const productsRef = collection(this.firestore, this.collectionName);
    
    return from(getDocs(productsRef)).pipe(
      map(snapshot => {
        const products = snapshot.docs.map(doc => doc.data() as Product);
        
        return {
          totalProducts: products.length,
          pendingRefunds: products.filter(p => !p.dineroRembolsado).length,
          completedRefunds: products.filter(p => p.dineroRembolsado > 0).length,
          averagePrice: products.length > 0 
            ? products.reduce((acc, curr) => acc + curr.precioCompra, 0) / products.length 
            : 0
        };
      })
    );
  }
}