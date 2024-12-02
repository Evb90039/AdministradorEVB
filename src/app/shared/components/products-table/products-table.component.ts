import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Product } from '../../interfaces/product.interface';
import { ProductService } from '../../services/product.service';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductEditModalComponent } from '../product-edit-modal/product-edit-modal.component';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';

@Component({
  selector: 'app-products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss']
})
export class ProductsTableComponent implements OnInit, OnDestroy {
  @ViewChild('cardsSlider') cardsSlider!: ElementRef;
  
  products$ = new BehaviorSubject<Product[]>([]);
  filteredProducts$: Observable<Product[]>;
  showFullText: boolean[] = [];
  currentSlide = 0;
  private subscription: Subscription;
  private touchStartX: number = 0;
  private touchEndX: number = 0;

  // Getters para la paginación dinámica
  get totalSlides(): number {
    return this.products$.getValue().length;
  }

  get paginationArray(): number[] {
    return Array(this.totalSlides).fill(0).map((_, i) => i);
  }

  constructor(
    private productService: ProductService,
    private modalService: NgbModal
  ) {
    this.filteredProducts$ = this.products$.asObservable();
    this.subscription = this.productService.productsUpdated$.subscribe(() => {
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent) {
    this.touchEndX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    const SWIPE_THRESHOLD = 50;
    const deltaX = this.touchEndX - this.touchStartX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0 && this.currentSlide > 0) {
        this.previousSlide();
      } else if (deltaX < 0 && this.currentSlide < (this.products$.getValue().length - 1)) {
        this.nextSlide();
      }
    }
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

  nextSlide(): void {
    if (!this.cardsSlider) return;
    if (this.currentSlide < this.totalSlides - 1) {
      this.goToSlide(this.currentSlide + 1);
    }
  }

  previousSlide(): void {
    if (this.currentSlide > 0) {
      this.goToSlide(this.currentSlide - 1);
    }
  }

  private loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      const convertedProducts = products.map(product => ({
        ...product,
        fechaAlta: (product.fechaAlta as unknown as Timestamp).toDate()
      }));
      this.products$.next(convertedProducts);
    });
  }

  editProduct(product: Product): void {
    const modalRef = this.modalService.open(ProductEditModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    modalRef.componentInstance.currentProduct = product;
    
    modalRef.closed.subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  duplicateProduct(product: Product): void {
    const newProduct = { ...product };
    delete newProduct['id'];
    this.productService.createProduct(newProduct).subscribe(() => {
      this.loadProducts();
    });
  }

  deleteProduct(product: Product): void {
    const productId = product.id;
    if (!productId) {
      console.error('Cannot delete product without an ID');
      return;
    }
    
    const modalRef = this.modalService.open(DeleteConfirmationModalComponent, {
      backdrop: 'static',
      keyboard: false
    });
    
    modalRef.closed.subscribe((result) => {
      if (result) {
        this.productService.deleteProduct(productId).subscribe(() => {
          this.loadProducts();
        });
      }
    });
  }

  toggleText(index: number): void {
    this.showFullText[index] = !this.showFullText[index];
  }
}