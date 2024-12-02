// products-table.component.ts
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
  private subscriptions: Subscription[] = [];
  filteredLength = 0;

  get paginationArray(): number[] {
    return Array(this.filteredLength).fill(0).map((_, i) => i);
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
        const filtered = products
          .filter(product => {
            const matchesSearch = searchTerm === '' || 
              product.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.nombreVendedor.toLowerCase().includes(searchTerm.toLowerCase());
              
            const matchesPending = !showOnlyPending || 
              (!product.dineroRembolsado && !product.ventaPublico);
              
            return matchesSearch && matchesPending;
          });
        
        this.filteredLength = filtered.length;
        return filtered;
      })
    );

    this.subscriptions.push(
      this.filteredProducts$.subscribe(products => {
        if (this.currentSlide >= products.length) {
          this.currentSlide = Math.max(0, products.length - 1);
          this.goToSlide(this.currentSlide);
        }
      }),
      this.productService.productsUpdated$.subscribe(() => {
        this.loadProducts();
      })
    );
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  goToSlide(index: number): void {
    if (!this.cardsSlider?.nativeElement) return;
    
    const slider = this.cardsSlider.nativeElement;
    const cardWidth = slider.offsetWidth;
    
    slider.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth'
    });
    
    this.currentSlide = index;
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
    if (!productId) return;
    
    const modalRef = this.modalService.open(DeleteConfirmationModalComponent, {
      backdrop: 'static'
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
    this.currentSlide = 0;
    this.goToSlide(0);
  }

  togglePendingFilter(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.showOnlyPending$.next(checkbox.checked);
    this.currentSlide = 0;
    this.goToSlide(0);
  }

  onScroll(): void {
    if (!this.cardsSlider?.nativeElement) return;
    
    const slider = this.cardsSlider.nativeElement;
    const cardWidth = slider.offsetWidth;
    const scrollPosition = slider.scrollLeft;
    
    this.currentSlide = Math.round(scrollPosition / cardWidth);
  }
}