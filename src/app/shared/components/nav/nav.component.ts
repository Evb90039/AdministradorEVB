// shared/components/nav/nav.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbCollapse, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbCollapse,
    ReactiveFormsModule,
    ProductModalComponent // Importamos el componente del modal
  ]
})
export class NavComponent {
  @Input() brandName: string = 'Mi App';
  isMenuCollapsed = true;

  constructor(private modalService: NgbModal) {} // Inyectamos NgbModal

  openProductModal() {
    const modalRef = this.modalService.open(ProductModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.then(
      (result) => {
        console.log('Modal cerrado con resultado:', result);
        // Aquí puedes manejar el resultado del modal
      },
      (reason) => {
        console.log('Modal cerrado por:', reason);
      }
    );
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}