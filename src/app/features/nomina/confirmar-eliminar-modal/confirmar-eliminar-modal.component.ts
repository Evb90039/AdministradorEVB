import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movimiento } from '../movimiento.interface';

@Component({
  selector: 'app-confirmar-eliminar-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-eliminar-modal.component.html',
  styleUrls: ['./confirmar-eliminar-modal.component.css']
})
export class ConfirmarEliminarModalComponent {
  @Input() movimiento!: Movimiento;
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar() {
    this.confirmar.emit();
  }

  onCancelar() {
    this.cancelar.emit();
  }
} 