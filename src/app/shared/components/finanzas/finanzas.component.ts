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
  @ViewChild('cardsSlider') cardsSlider!: ElementRef;
  
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
    if (this.cardsSlider) {
      this.cardsSlider.nativeElement.addEventListener('scroll', () => {
        this.onScroll();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.cardsSlider) {
      this.cardsSlider.nativeElement.removeEventListener('scroll', () => {
        this.onScroll();
      });
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
    if (this.cardsSlider) {
      const slider = this.cardsSlider.nativeElement;
      const scrollLeft = slider.scrollLeft;
      const slideWidth = slider.clientWidth;
      this.currentSlide = Math.round(scrollLeft / slideWidth);
    }
  }

  goToSlide(index: number): void {
    if (this.cardsSlider) {
      this.currentSlide = index;
      const slider = this.cardsSlider.nativeElement;
      const slideWidth = slider.clientWidth;
      slider.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      });
    }
  }
}