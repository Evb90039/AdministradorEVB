import { Component, OnInit, OnDestroy } from '@angular/core';
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
  products$ = new BehaviorSubject<Product[]>([]);
  filteredProducts$: Observable<Product[]>;
  showFullText: boolean[] = [];
  private subscription: Subscription;

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