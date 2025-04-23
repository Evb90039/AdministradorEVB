import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cuenta } from './cuenta.interface';
import { Movimiento } from './movimiento.interface';
import { NominaService } from '../../services/nomina.service';
import { MovimientosService } from '../../services/movimientos.service';
import { ReporteService } from '../../services/reporte.service';
import { Subscription } from 'rxjs';
import localeEs from '@angular/common/locales/es';
import { ConfirmarEliminarModalComponent } from './confirmar-eliminar-modal/confirmar-eliminar-modal.component';
import { NuevaCuentaModalComponent } from './nueva-cuenta-modal/nueva-cuenta-modal.component';
import { NuevoMovimientoModalComponent } from './nuevo-movimiento-modal/nuevo-movimiento-modal.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { ReporteGastosModalComponent } from './reporte-gastos-modal/reporte-gastos-modal.component';

registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-nomina',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ConfirmarEliminarModalComponent, 
    NuevaCuentaModalComponent,
    NuevoMovimientoModalComponent,
    SpinnerComponent,
    ReporteGastosModalComponent
  ],
  templateUrl: './nomina.component.html',
  styleUrls: ['./nomina.component.css'],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }]
})
export class NominaComponent implements OnInit, OnDestroy {
  cuentas: Cuenta[] = [];
  cuentasPaginadas: Cuenta[] = [];
  paginaActualCuentas: number = 1;
  registrosPorPaginaCuentas: number = 10;
  totalPaginasCuentas: number = 1;
  cuentaEditando: Cuenta | null = null;
  saldoTemporal: number = 0;
  saldoAAgregar: number | null = 0;
  total: number = 0;
  error: string = '';
  mostrarFormNuevaCuenta: boolean = false;
  nuevaCuenta: Omit<Cuenta, 'id'> = {
    nombre: '',
    saldo: 0
  };
  private subscriptions: Subscription = new Subscription();
  cargando: boolean = true;
  creandoCuenta: boolean = false;

  // Nuevas propiedades para movimientos
  fechaSeleccionada: Date = new Date();
  movimientos: Movimiento[] = [];
  movimientosPaginados: Movimiento[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 3;
  totalPaginas: number = 1;
  mostrarFormMovimiento: boolean = false;
  nuevoMovimiento: Omit<Movimiento, 'id'> = {
    fecha: new Date(),
    tipo: 'EGRESO',
    monto: 0,
    descripcion: '',
    cuentaId: '',
    cuentaNombre: ''
  };
  creandoMovimiento: boolean = false;
  totalIngresos: number = 0;
  totalEgresos: number = 0;

  movimientoAEliminar: Movimiento | null = null;
  private errorTimeout: any;
  mostrarFormReporte: boolean = false;

  constructor(
    private nominaService: NominaService,
    private movimientosService: MovimientosService,
    private reporteService: ReporteService
  ) {}

  ngOnInit() {
    this.cargarCuentas();
    this.cargarMovimientosPorFecha();
    
    // Suscribirse a actualizaciones
    this.subscriptions.add(
      this.nominaService.cuentasUpdated$.subscribe(() => {
        this.cargarCuentas();
      })
    );

    this.subscriptions.add(
      this.movimientosService.movimientosUpdated$.subscribe(() => {
        this.cargarMovimientosPorFecha();
      })
    );

    this.actualizarPaginacion();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  // Método para manejar errores
  private mostrarError(mensaje: string) {
    // Limpiar timeout anterior si existe
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    
    this.error = mensaje;
    
    // Establecer nuevo timeout
    this.errorTimeout = setTimeout(() => {
      this.error = '';
    }, 5000);
  }

  cargarCuentas() {
    console.log('Iniciando carga de cuentas...');
    this.cargando = true;

    const cuentasSub = this.nominaService.getCuentas().subscribe({
      next: (cuentas) => {
        console.log('Cuentas recibidas en el componente:', cuentas);
        this.cuentas = cuentas.sort((a, b) => (b.saldo || 0) - (a.saldo || 0));
        this.calcularTotal();
        this.actualizarPaginacionCuentas();
        this.error = '';
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error en la suscripción de cuentas:', error);
        
        if (error.name === 'FirebaseError') {
          switch (error.code) {
            case 'failed-precondition':
              this.mostrarError('Error de inicialización de Firebase. Por favor, contacte al administrador.');
              break;
            case 'permission-denied':
              this.mostrarError('No tiene permisos para acceder a los datos. Por favor, verifique su sesión.');
              break;
            case 'unavailable':
              this.mostrarError('Servicio no disponible. Por favor, verifique su conexión a internet.');
              break;
            default:
              this.mostrarError(`Error de Firebase: ${error.message}`);
          }
        } else {
          this.mostrarError('Error al cargar las cuentas. Por favor, intente nuevamente.');
        }
        
        this.cargando = false;
        this.cuentas = [];
      }
    });
    
    this.subscriptions.add(cuentasSub);
  }

  calcularTotal() {
    this.total = this.cuentas.reduce((sum, cuenta) => sum + (cuenta.saldo || 0), 0);
    console.log('Total calculado:', this.total);
  }

  agregarsaldo(cuenta: Cuenta) {
    this.cuentaEditando = cuenta;
    this.saldoTemporal = cuenta.saldo;
    this.saldoAAgregar = 0;
    this.error = '';
  }

  editarCuenta(cuenta: Cuenta) {
    this.cuentaEditando = cuenta;
    this.saldoTemporal = cuenta.saldo;
    this.saldoAAgregar = null;
    this.error = '';
  }

  async guardarCambios(cuenta: Cuenta) {
    if (this.cuentaEditando && cuenta.id) {
      this.cargando = true;
      try {
        await this.nominaService.actualizarSaldo(cuenta.id, this.saldoTemporal);
        cuenta.saldo = this.saldoTemporal;
        this.calcularTotal();
        this.cuentaEditando = null;
        this.error = '';
      } catch (error) {
        console.error('Error al guardar los cambios:', error);
        this.mostrarError('Error al guardar los cambios. Por favor, intente nuevamente.');
      } finally {
        this.cargando = false;
      }
    }
  }

  async agregarSaldo(cuenta: Cuenta) {
    if (cuenta.id && this.saldoAAgregar) {
      this.cargando = true;
      try {
        const nuevoSaldo = cuenta.saldo + this.saldoAAgregar;
        await this.nominaService.actualizarSaldo(cuenta.id, nuevoSaldo);
        cuenta.saldo = nuevoSaldo;
        this.calcularTotal();
        this.saldoAAgregar = 0;
        this.cuentaEditando = null;
        this.error = '';
      } catch (error) {
        console.error('Error al agregar saldo:', error);
        this.mostrarError('Error al agregar saldo. Por favor, intente nuevamente.');
      } finally {
        this.cargando = false;
      }
    }
  }

  mostrarFormularioNuevaCuenta() {
    this.mostrarFormNuevaCuenta = true;
  }

  async crearNuevaCuenta(nuevaCuenta: { nombre: string; saldo: number }) {
    try {
      this.creandoCuenta = true;
      console.log('Intentando crear nueva cuenta:', nuevaCuenta);
      
      await this.nominaService.agregarCuenta(nuevaCuenta);

      console.log('Cuenta creada exitosamente');
      this.mostrarFormNuevaCuenta = false;
      this.error = '';
    } catch (error: any) {
      console.error('Error al crear cuenta:', error);
      this.error = error.message || 'Error al crear la cuenta. Por favor, intente nuevamente.';
    } finally {
      this.creandoCuenta = false;
    }
  }

  cancelarNuevaCuenta() {
    this.mostrarFormNuevaCuenta = false;
    this.error = '';
  }

  cancelarEdicion() {
    this.cuentaEditando = null;
    this.saldoAAgregar = 0;
    this.saldoTemporal = 0;
    this.error = '';
  }

  async eliminarCuenta(cuenta: Cuenta) {
    if (!cuenta.id) return;
    
    if (cuenta.saldo !== 0) {
      this.mostrarError('No se puede eliminar una cuenta con saldo.');
      return;
    }

    this.cargando = true;
    try {
      await this.nominaService.eliminarCuenta(cuenta.id);
      this.error = '';
    } catch (error: any) {
      console.error('Error al eliminar cuenta:', error);
      this.mostrarError('Error al eliminar la cuenta. Por favor, intente nuevamente.');
    } finally {
      this.cargando = false;
    }
  }

  cargarMovimientosPorFecha() {
    this.movimientosService.getMovimientosPorFecha(this.fechaSeleccionada)
      .subscribe({
        next: (movimientos) => {
          this.movimientos = movimientos;
          this.calcularTotales();
          this.actualizarPaginacion();
        },
        error: (error) => {
          console.error('Error al cargar movimientos:', error);
          this.mostrarError('Error al cargar los movimientos.');
        }
      });
  }

  calcularTotales() {
    this.totalIngresos = this.movimientos
      .filter(m => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + m.monto, 0);
    
    this.totalEgresos = this.movimientos
      .filter(m => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  mostrarFormularioMovimiento() {
    this.mostrarFormMovimiento = true;
    this.nuevoMovimiento = {
      fecha: new Date(),
      tipo: 'EGRESO',
      monto: 0,
      descripcion: '',
      cuentaId: '',
      cuentaNombre: ''
    };
    this.error = '';
  }

  async crearMovimiento(nuevoMovimiento: { tipo: 'INGRESO' | 'EGRESO', monto: number, descripcion: string, cuentaId: string, fecha: string }) {
    if (!nuevoMovimiento.cuentaId || !nuevoMovimiento.descripcion || nuevoMovimiento.monto <= 0) {
      this.mostrarError('Por favor, complete todos los campos correctamente.');
      return;
    }

    this.creandoMovimiento = true;
    try {
      const cuenta = this.cuentas.find(c => c.id === nuevoMovimiento.cuentaId);
      if (!cuenta) throw new Error('Cuenta no encontrada');

      // Crear la fecha sin problemas de zona horaria
      const [year, month, day] = nuevoMovimiento.fecha.split('-').map(Number);
      const fechaMovimiento = new Date(year, month - 1, day);
      fechaMovimiento.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de zona horaria

      const movimientoCompleto = {
        ...nuevoMovimiento,
        fecha: fechaMovimiento,
        cuentaNombre: cuenta.nombre
      };

      await this.movimientosService.agregarMovimiento(movimientoCompleto);
      
      // Actualizar saldo de la cuenta
      const nuevoSaldo = nuevoMovimiento.tipo === 'INGRESO' 
        ? cuenta.saldo + nuevoMovimiento.monto
        : cuenta.saldo - nuevoMovimiento.monto;
      
      await this.nominaService.actualizarSaldo(cuenta.id!, nuevoSaldo);
      
      this.mostrarFormMovimiento = false;
      this.error = '';
    } catch (error: any) {
      console.error('Error al crear movimiento:', error);
      this.error = error.message || 'Error al crear el movimiento.';
    } finally {
      this.creandoMovimiento = false;
    }
  }

  cancelarMovimiento() {
    this.mostrarFormMovimiento = false;
    this.error = '';
  }

  cambiarFecha(dias: number) {
    const nuevaFecha = new Date(this.fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    this.fechaSeleccionada = nuevaFecha;
    this.cargarMovimientosPorFecha();
  }

  async eliminarMovimiento(movimiento: Movimiento) {
    if (!movimiento.id || !movimiento.cuentaId) return;

    try {
      // Primero, encontrar la cuenta asociada
      const cuenta = this.cuentas.find(c => c.id === movimiento.cuentaId);
      if (!cuenta) throw new Error('Cuenta no encontrada');

      // Calcular el nuevo saldo de la cuenta
      const nuevoSaldo = movimiento.tipo === 'INGRESO'
        ? cuenta.saldo - movimiento.monto  // Si era un ingreso, restamos
        : cuenta.saldo + movimiento.monto; // Si era un egreso, sumamos

      // Eliminar el movimiento
      await this.movimientosService.eliminarMovimiento(
        movimiento.id,
        movimiento.cuentaId,
        movimiento.monto,
        movimiento.tipo
      );

      // Actualizar el saldo de la cuenta
      await this.nominaService.actualizarSaldo(cuenta.id!, nuevoSaldo);

      this.error = '';
    } catch (error: any) {
      console.error('Error al eliminar movimiento:', error);
      this.error = error.message || 'Error al eliminar el movimiento.';
    }
  }

  mostrarConfirmacionEliminar(movimiento: Movimiento) {
    this.movimientoAEliminar = movimiento;
  }

  async confirmarEliminarMovimiento() {
    if (!this.movimientoAEliminar) return;
    
    await this.eliminarMovimiento(this.movimientoAEliminar);
    this.movimientoAEliminar = null;
  }

  cancelarEliminarMovimiento() {
    this.movimientoAEliminar = null;
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.movimientosPaginados = this.movimientos.slice(inicio, fin);
    this.totalPaginas = Math.ceil(this.movimientos.length / this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  paginaAnterior() {
    this.cambiarPagina(this.paginaActual - 1);
  }

  paginaSiguiente() {
    this.cambiarPagina(this.paginaActual + 1);
  }

  actualizarPaginacionCuentas() {
    const inicio = (this.paginaActualCuentas - 1) * this.registrosPorPaginaCuentas;
    const fin = inicio + this.registrosPorPaginaCuentas;
    this.cuentasPaginadas = this.cuentas.slice(inicio, fin);
    this.totalPaginasCuentas = Math.ceil(this.cuentas.length / this.registrosPorPaginaCuentas);
  }

  paginaAnteriorCuentas() {
    if (this.paginaActualCuentas > 1) {
      this.paginaActualCuentas--;
      this.actualizarPaginacionCuentas();
    }
  }

  paginaSiguienteCuentas() {
    if (this.paginaActualCuentas < this.totalPaginasCuentas) {
      this.paginaActualCuentas++;
      this.actualizarPaginacionCuentas();
    }
  }

  mostrarFormularioReporte() {
    this.mostrarFormReporte = true;
  }

  cancelarReporte() {
    this.mostrarFormReporte = false;
  }

  async generarReporte(event: { fechaInicio: Date, fechaFin: Date }) {
    try {
      // Asegurarnos de que las fechas sean objetos Date
      const fechaInicio = new Date(event.fechaInicio);
      const fechaFin = new Date(event.fechaFin);
      
      const movimientos = await this.movimientosService.getMovimientosPorRango(fechaInicio, fechaFin).toPromise();
      if (movimientos) {
        await this.reporteService.generarReportePDF(movimientos, fechaInicio, fechaFin);
      }
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      this.mostrarError('Error al generar el reporte. Por favor, intente nuevamente.');
    }
    this.mostrarFormReporte = false;
  }
}
