import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finanzas.component.html',
  styleUrl: './finanzas.component.css'
})
export class FinanzasComponent implements OnInit, OnDestroy {
  totalCompras: number = 0;
  private subscription: Subscription;

  constructor(private productService: ProductService) {
    // Suscribirse a los cambios de productos
    this.subscription = this.productService.productsUpdated$
      .subscribe(() => {
        this.loadTotalCompras();
      });
  }

  ngOnInit(): void {
    this.loadTotalCompras();
  }

  ngOnDestroy(): void {
    // Limpiamos la suscripción cuando el componente se destruye
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadTotalCompras(): void {
    this.productService.getTotalCompras()
      .pipe(
        catchError(error => {
          console.error('Error al cargar el total de compras:', error);
          return of(0);
        })
      )
      .subscribe(total => {
        this.totalCompras = total;
      });
  }
}