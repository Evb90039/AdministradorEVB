import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { ProductMetrics } from '../../interfaces/product.interface';
import { catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finanzas.component.html',
  styleUrl: './finanzas.component.css'
})
export class FinanzasComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardsslider') cardsSlider!: ElementRef;
  
  totalCompras: number = 0;
  faltaRembolsar: number = 0;
  totalVendido: number = 0;
  gananciaTotal: number = 0;
  currentSlide: number = 0;
  lastUpdateTime: Date | null = null;
  productMetrics: ProductMetrics = {
    totalProducts: 0,
    pendingRefunds: 0,
    completedRefunds: 0,
    averagePrice: 0
  };

  visibleBalances: { [key: string]: boolean } = {
    'compras': true,
    'reembolsos': true,
    'vendido': true,
    'ganancia': true
  };
  private subscription: Subscription;

  constructor(private productService: ProductService) {
    this.subscription = this.productService.productsUpdated$
      .subscribe(() => {
        this.loadTotalCompras();
        this.loadFaltaRembolsar();
        this.loadTotalVendido();
        this.loadGananciaTotal();
        this.loadMetrics();
      });
  }

  ngOnInit(): void {
    this.loadTotalCompras();
    this.loadFaltaRembolsar();
    this.loadTotalVendido();
    this.loadGananciaTotal();
    this.loadMetrics();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadMetrics(): void {
    this.productService.getProductMetrics()
      .pipe(
        catchError(error => {
          console.error('Error al cargar las métricas:', error);
          return of({
            totalProducts: 0,
            pendingRefunds: 0,
            completedRefunds: 0,
            averagePrice: 0
          });
        })
      )
      .subscribe(metrics => {
        this.productMetrics = metrics;
        this.lastUpdateTime = new Date();
      });
  }

  toggleBalance(key: string): void {
    this.visibleBalances[key] = !this.visibleBalances[key];
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

  private loadFaltaRembolsar(): void {
    this.productService.calcularFaltaRembolsar()
      .pipe(
        catchError(error => {
          console.error('Error al cargar el total por rembolsar:', error);
          return of(0);
        })
      )
      .subscribe(total => {
        this.faltaRembolsar = total;
      });
  }

  private loadTotalVendido(): void {
    this.productService.calcularVendido()
      .pipe(
        catchError(error => {
          console.error('Error al cargar el total de compras:', error);
          return of(0);
        })
      )
      .subscribe(total => {
        this.totalVendido = total;
      });
  }

  private loadGananciaTotal(): void {
    this.productService.calcularGananciaTotal()
      .pipe(
        catchError(error => {
          console.error('Error al cargar la ganancia total:', error);
          return of(0);
        })
      )
      .subscribe(total => {
        this.gananciaTotal = total;
      });
  }

  onScroll(): void {
    if (!this.cardsSlider) return;
    
    const slider = this.cardsSlider.nativeElement;
    const cardWidth = slider.offsetWidth;
    const scrollPosition = slider.scrollLeft;
    
    let index = Math.round(scrollPosition / cardWidth);
    index = Math.max(0, Math.min(3, index));
    
    if (Math.abs(slider.scrollWidth - (scrollPosition + slider.offsetWidth)) < 5) {
      index = 3;
    }
    
    this.currentSlide = index;
  }

  goToSlide(index: number): void {
    if (!this.cardsSlider) return;
    
    const slider = this.cardsSlider.nativeElement;
    const cardWidth = slider.offsetWidth;
    
    slider.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth'
    });
    
    this.currentSlide = index;
  }
}