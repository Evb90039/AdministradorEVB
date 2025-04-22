import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NuevaCuenta {
  nombre: string;
  saldo: number;
}

@Component({
  selector: 'app-nueva-cuenta-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-cuenta-modal.component.html',
  styleUrls: ['./nueva-cuenta-modal.component.css']
})
export class NuevaCuentaModalComponent {
  @Output() confirmar = new EventEmitter<NuevaCuenta>();
  @Output() cancelar = new EventEmitter<void>();

  nuevaCuenta: NuevaCuenta = {
    nombre: '',
    saldo: 0
  };

  onConfirmar() {
    if (this.nuevaCuenta.nombre) {
      this.confirmar.emit({
        nombre: this.nuevaCuenta.nombre.toUpperCase(),
        saldo: this.nuevaCuenta.saldo || 0
      });
    }
  }

  onCancelar() {
    this.cancelar.emit();
  }
} 