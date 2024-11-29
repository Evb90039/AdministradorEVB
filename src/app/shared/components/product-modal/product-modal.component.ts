// src/app/shared/components/product-modal/product-modal.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.css']
})
export class ProductModalComponent implements OnInit {
  productForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      fechaAlta: ['', Validators.required],
      nombreVendedor: ['', Validators.required],
      nombreProducto: ['', Validators.required],
      enlace: ['', [Validators.required, Validators.pattern('https?://.+')]],
      precioCompra: ['', [Validators.required, Validators.min(0)]],
      dineroRembolsado: ['', [Validators.required, Validators.min(0)]],
      ventaPublico: ['', [Validators.required, Validators.min(0)]],
      tienda: ['', Validators.required],
      resena: [false],
      contacto: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.productForm.patchValue({
      fechaAlta: new Date().toISOString().split('T')[0]
    });
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.productService.createProduct(this.productForm.value)
        .subscribe({
          next: (response) => {
            console.log('Producto creado:', response);
            this.activeModal.close(response);
          },
          error: (error) => {
            console.error('Error al crear producto:', error);
            // Aquí puedes agregar manejo de errores
          }
        });
    }
  }
}