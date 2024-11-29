import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class FinanzasComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardsslider') cardsSlider!: ElementRef;
  
  totalCompras: number = 0;
  currentSlide: number = 0;
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
      });
  }

  ngOnInit(): void {
    this.loadTotalCompras();
  }

  ngAfterViewInit(): void {
    // No es necesario agregar event listener adicional ya que usamos (scroll) en el template
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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

  onScroll(): void {
    if (!this.cardsSlider) return;
    
    const slider = this.cardsSlider.nativeElement;
    const cardWidth = slider.offsetWidth;
    const scrollPosition = slider.scrollLeft;
    
    // Calculamos el índice basado en el scroll y el ancho de la tarjeta
    let index = Math.round(scrollPosition / cardWidth);
    
    // Nos aseguramos que el índice esté entre 0 y 3
    index = Math.max(0, Math.min(3, index));
    
    // Si estamos cerca del final, forzamos el último índice
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