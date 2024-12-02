import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Product } from '../../interfaces/product.interface';
import { ProductService } from '../../services/product.service';
import { Observable, BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  searchTerm$ = new BehaviorSubject<string>('');
  showOnlyPending$ = new BehaviorSubject<boolean>(false);
  filteredProducts$: Observable<Product[]>;
  showFullText: boolean[] = [];
  currentSlide = 0;
  private subscription: Subscription;
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private filteredProductsSubscription: Subscription;
  private filteredProductsLength: number = 0;

  get totalSlides(): number {
    return this.filteredProductsLength;
  }

  get paginationArray(): number[] {
    return Array(this.filteredProductsLength).fill(0).map((_, i) => i);
  }

  constructor(
    private productService: ProductService,
    private modalService: NgbModal
  ) {
    this.filteredProducts$ = combineLatest([
      this.products$,
      this.searchTerm$.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.showOnlyPending$
    ]).pipe(
      map(([products, searchTerm, showOnlyPending]) => {
        return products
          .filter(product => {
            const matchesSearch = searchTerm === '' || 
              product.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.nombreVendedor.toLowerCase().includes(searchTerm.toLowerCase());
              
            const matchesPending = !showOnlyPending || 
              (!product.dineroRembolsado && !product.ventaPublico);
              
            return matchesSearch && matchesPending;
          });
      })
    );

    this.filteredProductsSubscription = this.filteredProducts$.subscribe(products => {
      this.filteredProductsLength = products.length;
      if (this.currentSlide >= this.filteredProductsLength) {
        this.currentSlide = Math.max(0, this.filteredProductsLength - 1);
        this.goToSlide(this.currentSlide);
      }
    });

    this.subscription = this.productService.productsUpdated$.subscribe(() => {
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.filteredProductsSubscription.unsubscribe();
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent): void {
    this.touchEndX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    const SWIPE_THRESHOLD = 50;
    const deltaX = this.touchEndX - this.touchStartX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0 && this.currentSlide > 0) {
        this.previousSlide();
      } else if (deltaX < 0 && this.currentSlide < (this.filteredProductsLength - 1)) {
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
    if (this.currentSlide < this.filteredProductsLength - 1) {
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

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm$.next(input.value);
  }

  togglePendingFilter(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.showOnlyPending$.next(checkbox.checked);
  }
}