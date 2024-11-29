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
  isSubmitting = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      fechaAlta: ['', Validators.required],
      nombreVendedor: ['', [Validators.required, Validators.minLength(2)]],
      nombreProducto: ['', [Validators.required, Validators.minLength(3)]],
      enlace: ['', [
        Validators.required, 
        Validators.pattern('https?://.+')
      ]],
      precioCompra: ['', [
        Validators.required, 
        Validators.min(0),
        Validators.pattern(/^\d+(\.\d{1,2})?$/)
      ]],
      dineroRembolsado: ['', [
        Validators.required, 
        Validators.min(0),
        Validators.pattern(/^\d+(\.\d{1,2})?$/)
      ]],
      ventaPublico: ['', [
        Validators.required, 
        Validators.min(0),
        Validators.pattern(/^\d+(\.\d{1,2})?$/)
      ]],
      tienda: ['', Validators.required],
      resena: [false],
      contacto: ['', [
        Validators.required,
        Validators.minLength(3)
      ]]
    });
  }

  ngOnInit() {
    // Set current date as default
    this.productForm.patchValue({
      fechaAlta: new Date().toISOString().split('T')[0]
    });

    // Add validation for ventaPublico being greater than precioCompra
    this.productForm.get('ventaPublico')?.valueChanges.subscribe(value => {
      const precioCompra = this.productForm.get('precioCompra')?.value;
      if (precioCompra && value <= precioCompra) {
        this.productForm.get('ventaPublico')?.setErrors({ 
          priceTooLow: true 
        });
      }
    });
  }

  onSubmit() {
    if (this.productForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formData = {
        ...this.productForm.value,
        precioCompra: Number(this.productForm.value.precioCompra),
        dineroRembolsado: Number(this.productForm.value.dineroRembolsado),
        ventaPublico: Number(this.productForm.value.ventaPublico)
      };

      this.productService.createProduct(formData).subscribe({
        next: (response) => {
          console.log('Producto creado:', response);
          this.activeModal.close(response);
        },
        error: (error) => {
          console.error('Error al crear producto:', error);
          // Aquí podrías mostrar un mensaje de error al usuario
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  // Helper method for template
  getErrorMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['minlength']) return 'Longitud mínima no alcanzada';
      if (control.errors['pattern']) {
        if (controlName === 'enlace') return 'URL inválida';
        return 'Formato inválido';
      }
      if (control.errors['min']) return 'El valor debe ser mayor a 0';
      if (control.errors['priceTooLow']) return 'El precio de venta debe ser mayor al precio de compra';
    }
    return '';
  }
}