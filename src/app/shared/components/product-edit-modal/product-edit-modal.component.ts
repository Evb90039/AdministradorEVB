// product-edit-modal.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Product } from '../../interfaces/product.interface';
import { ProductService } from '../../services/product.service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-edit-modal',
  templateUrl: './product-edit-modal.component.html',
  styleUrls: ['./product-edit-modal.component.scss'],
  standalone: true,
  imports: [ ReactiveFormsModule]
})
export class ProductEditModalComponent implements OnInit {
  @ViewChild('dineroRembolsadoInput') dineroRembolsadoInput!: ElementRef;
  productForm: FormGroup;
  currentProduct?: Product;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    public activeModal: NgbActiveModal
  ) {
    this.productForm = this.initForm();
  }
  ngAfterViewInit() {
    this.dineroRembolsadoInput.nativeElement.focus();
  }
  ngOnInit() {
    if (this.currentProduct) {
      this.productForm.patchValue({
        ...this.currentProduct,
        fechaAlta: this.formatDate(this.currentProduct.fechaAlta)
      });
    }
  }

  private initForm(): FormGroup {
    return this.fb.group({
      fechaAlta: ['', Validators.required],
      nombreVendedor: ['', [Validators.required, Validators.minLength(2)]],
      nombreProducto: ['', [Validators.required, Validators.minLength(3)]],
      enlace: ['', [Validators.required, Validators.pattern('https?://.+')]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      dineroRembolsado: [0, [Validators.required, Validators.min(0)]],
      ventaPublico: [0, [Validators.required, Validators.min(0)]],
      tienda: ['AMAZON', Validators.required],
      resena: [false]
    });
  }

  onSubmit() {
    if (this.productForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const fechaInput = this.productForm.value.fechaAlta;
      // Ajustar la fecha para que use la zona horaria local
      const fecha = new Date(fechaInput + 'T00:00:00');
      
      const formData = {
        ...this.productForm.value,
        fechaAlta: fecha
      };

      if (this.currentProduct?.id) {
        this.productService.updateProduct(this.currentProduct.id, formData)
          .subscribe({
            next: () => this.activeModal.close(true),
            error: (error) => console.error('Error:', error),
            complete: () => this.isSubmitting = false
          });
      }
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}