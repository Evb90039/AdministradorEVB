import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CitasService, Cita, ResumenPaciente } from '../../services/citas.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

interface CitaCompleta extends Omit<Cita, 'id'> {
  id: string;
  nombrePaciente: string;
  telefono: string;
  monto: number;
  fecha: Date;
  pagado: boolean;
}

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent implements OnInit {
  @ViewChild('citaForm') citaForm!: NgForm;
  private refreshSubject = new BehaviorSubject<void>(undefined);
  citas$: Observable<CitaCompleta[]>;
  citasResumen: { [key: string]: ResumenPaciente } = {};
  
  horariosDisponibles = [
    { value: '7:00 PM', label: '7:00 PM' },
    { value: '8:00 PM', label: '8:00 PM' },
    { value: '9:00 PM', label: '9:00 PM' },
    { value: '10:00 PM', label: '10:00 PM' }
  ];
  
  nuevaCita: Omit<Cita, 'id'> & { 
    soloFecha: string;
    hora: string;
  } = this.inicializarNuevaCita();

  modoReagendar: boolean = false;

  constructor(private citasService: CitasService) {
    this.citas$ = this.refreshSubject.pipe(
      switchMap(() => this.citasService.getCitas()),
      map(citas => citas.filter((cita): cita is CitaCompleta => {
        if (!cita.id) return false;
        return true;
      }).map(cita => ({
        ...cita,
        nombrePaciente: cita.nombrePaciente || 'Sin nombre',
        telefono: cita.telefono || 'Sin teléfono',
        monto: cita.monto || 0,
        fecha: cita.fecha || new Date(),
        pagado: cita.pagado ?? false
      }))),
      tap(citas => {
        // Obtener resumen para cada paciente único
        const pacientesUnicos = [...new Set(citas.map(c => c.nombrePaciente))];
        pacientesUnicos.forEach(nombrePaciente => {
          if (nombrePaciente !== 'Sin nombre') {
            this.citasService.getResumenPaciente(nombrePaciente)
              .subscribe({
                next: resumen => {
                  this.citasResumen[nombrePaciente] = resumen;
                },
                error: error => {
                  console.error('Error al obtener resumen para', nombrePaciente, error);
                }
              });
          }
        });
      })
    );
  }

  ngOnInit(): void {
    this.refreshCitas();
  }

  private inicializarNuevaCita(): Omit<Cita, 'id'> & { soloFecha: string; hora: string } {
    return {
      pacienteId: '',
      nombrePaciente: '',
      fecha: new Date(),
      soloFecha: '',
      hora: '',
      monto: 0,
      pagado: false,
      telefono: ''
    };
  }

  combinarFechaHora(): Date {
    if (!this.nuevaCita.soloFecha || !this.nuevaCita.hora) {
      return new Date();
    }

    const [hora, periodo] = this.nuevaCita.hora.split(' ');
    const [horaStr, minutos] = hora.split(':');
    let horaNum = parseInt(horaStr);
    
    if (periodo === 'PM' && horaNum !== 12) {
      horaNum += 12;
    } else if (periodo === 'AM' && horaNum === 12) {
      horaNum = 0;
    }

    const fecha = new Date(this.nuevaCita.soloFecha);
    fecha.setHours(horaNum, parseInt(minutos), 0);
    return fecha;
  }

  refreshCitas(): void {
    this.refreshSubject.next(undefined);
  }

  reagendarCita(cita: CitaCompleta): void {
    this.modoReagendar = true;
    this.nuevaCita = {
      ...this.inicializarNuevaCita(),
      pacienteId: cita.pacienteId,
      nombrePaciente: cita.nombrePaciente,
      telefono: cita.telefono,
      monto: cita.monto
    };
    
    this.nuevaCita.soloFecha = '';
    this.nuevaCita.hora = '';
    
    // Verificar y actualizar el resumen del paciente
    this.citasService.getResumenPaciente(cita.nombrePaciente)
      .subscribe({
        next: (resumen) => {
          this.citasResumen[cita.nombrePaciente] = resumen;
          if (resumen.citasPendientesPago > 0) {
            const mensaje = `
              Resumen del paciente ${cita.nombrePaciente}:
              - Total de consultas: ${resumen.totalCitas}
              - Consultas pendientes: ${resumen.citasPendientesPago}
              - Monto pendiente: $${resumen.montoPendiente.toLocaleString()}
            `;
          }
        },
        error: (error) => {
          console.error('Error al obtener resumen del paciente:', error);
        }
      });
    
    document.getElementById('nueva-cita')?.scrollIntoView({ behavior: 'smooth' });
  }

  agregarCita(): void {
    if (this.citaForm.valid) {
      if (!this.nuevaCita.nombrePaciente || !this.nuevaCita.telefono || 
          !this.nuevaCita.soloFecha || !this.nuevaCita.hora || 
          this.nuevaCita.monto <= 0) {
        alert('Por favor, complete todos los campos requeridos correctamente.');
        return;
      }

      // Verificar pagos pendientes antes de agregar la cita
      const resumen = this.citasResumen[this.nuevaCita.nombrePaciente];
      if (resumen?.citasPendientesPago > 2) {
        const confirmar = confirm(`
          Advertencia: El paciente tiene ${resumen.citasPendientesPago} consultas sin pagar 
          por un monto total de $${resumen.montoPendiente.toLocaleString()}.
          ¿Desea continuar con la programación de la cita?
        `);
        if (!confirmar) return;
      }

      const fechaCompleta = this.combinarFechaHora();
      
      this.citasService.agregarCita({
        ...this.nuevaCita,
        fecha: fechaCompleta,
        monto: Number(this.nuevaCita.monto)
      })
      .then(() => {
        console.log('Cita agregada exitosamente');
        this.nuevaCita = this.inicializarNuevaCita();
        this.citaForm.resetForm();
        this.modoReagendar = false;
        this.refreshCitas();
      })
      .catch(error => {
        console.error('Error al agregar cita:', error);
        alert('Error al agregar la cita. Por favor, intente nuevamente.');
      });
    } else {
      Object.keys(this.citaForm.controls).forEach(key => {
        const control = this.citaForm.controls[key];
        if (control.invalid) {
          control.markAsTouched();
        }
      });
      alert('Por favor, complete todos los campos requeridos correctamente.');
    }
  }

  cancelarReagendar(): void {
    this.modoReagendar = false;
    this.nuevaCita = this.inicializarNuevaCita();
    this.citaForm.resetForm();
  }

  actualizarPago(citaId: string, pagado: boolean): void {
    this.citasService.actualizarPago(citaId, pagado)
      .then(() => {
        console.log('Estado de pago actualizado');
        this.refreshCitas();
      })
      .catch(error => {
        console.error('Error al actualizar pago:', error);
        alert('Error al actualizar el estado de pago. Por favor, intente nuevamente.');
      });
  }

  eliminarCita(citaId: string): void {
    if (confirm('¿Está seguro que desea eliminar esta cita?')) {
      this.citasService.eliminarCita(citaId)
        .then(() => {
          console.log('Cita eliminada exitosamente');
          this.refreshCitas();
        })
        .catch(error => {
          console.error('Error al eliminar cita:', error);
          alert('Error al eliminar la cita. Por favor, intente nuevamente.');
        });
    }
  }
}