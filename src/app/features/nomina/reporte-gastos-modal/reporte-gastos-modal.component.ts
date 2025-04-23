import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reporte-gastos-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reporte-gastos-modal.component.html',
  styleUrls: ['./reporte-gastos-modal.component.scss']
})
export class ReporteGastosModalComponent {
  @Output() confirmar = new EventEmitter<{ fechaInicio: Date; fechaFin: Date }>();
  @Output() cancelar = new EventEmitter<void>();

  reportForm: FormGroup;

  tipoMovimientoOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'ingresos', label: 'Ingresos' },
    { value: 'egresos', label: 'Egresos' }
  ];

  constructor(private fb: FormBuilder) {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    this.reportForm = this.fb.group({
      fechaInicio: [formattedDate, Validators.required],
      fechaFin: [formattedDate, Validators.required],
      tipoMovimiento: ['todos', Validators.required],
      categoria: ['']
    });
  }

  onSubmit(): void {
    if (this.reportForm.valid) {
      const formValue = this.reportForm.value;
      
      // Crear fechas asegurando que sean de la fecha seleccionada
      const [year, month, day] = formValue.fechaInicio.split('-').map(Number);
      
      const fechaInicio = new Date(year, month - 1, day);
      fechaInicio.setHours(0, 0, 0, 0);
      
      const fechaFin = new Date(year, month - 1, day);
      fechaFin.setHours(23, 59, 59, 999);

      console.log('Valores del formulario:', formValue);
      console.log('Fecha Inicio:', fechaInicio.toLocaleString());
      console.log('Fecha Fin:', fechaFin.toLocaleString());
      console.log('Fecha Inicio (ISO):', fechaInicio.toISOString());
      console.log('Fecha Fin (ISO):', fechaFin.toISOString());

      this.confirmar.emit({
        fechaInicio,
        fechaFin
      });
    }
  }

  onCancel(): void {
    this.cancelar.emit();
  }
} 