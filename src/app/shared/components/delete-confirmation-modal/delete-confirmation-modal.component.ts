// delete-confirmation-modal.component.ts
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-delete-confirmation-modal',
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Confirmar eliminación</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <p>¿Estás seguro que deseas eliminar este producto?</p>
      <p class="text-muted">Esta acción no se puede deshacer.</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="modal.dismiss()">Cancelar</button>
      <button type="button" class="btn btn-danger" (click)="modal.close(true)">Eliminar</button>
    </div>
  `
})
export class DeleteConfirmationModalComponent {
  constructor(public modal: NgbActiveModal) {}
}