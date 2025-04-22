import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cuenta } from '../cuenta.interface';

interface NuevoMovimiento {
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  descripcion: string;
  cuentaId: string;
  fecha: string;
}

@Component({
  selector: 'app-nuevo-movimiento-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-movimiento-modal.component.html',
  styleUrls: ['./nuevo-movimiento-modal.component.css']
})
export class NuevoMovimientoModalComponent {
  @Input() cuentas: Cuenta[] = [];
  @Output() confirmar = new EventEmitter<NuevoMovimiento>();
  @Output() cancelar = new EventEmitter<void>();

  nuevoMovimiento: NuevoMovimiento = {
    tipo: 'EGRESO',
    monto: 0,
    descripcion: '',
    cuentaId: '',
    fecha: new Date().toISOString().split('T')[0]
  };

  onConfirmar() {
    if (this.nuevoMovimiento.cuentaId && this.nuevoMovimiento.descripcion && this.nuevoMovimiento.monto > 0) {
      this.confirmar.emit(this.nuevoMovimiento);
    }
  }

  onCancelar() {
    this.cancelar.emit();
  }
} 