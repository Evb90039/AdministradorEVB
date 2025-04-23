import { Injectable } from '@angular/core';
import { Movimiento } from '../features/nomina/movimiento.interface';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  constructor() {}

  async generarReportePDF(movimientos: Movimiento[], fechaInicio: Date, fechaFin: Date) {
    const doc = new jsPDF();
    
    // Título del reporte
    doc.setFontSize(20);
    doc.text('Reporte de Gastos', 14, 15);
    
    // Función para ajustar la fecha a la zona horaria local
    const ajustarFecha = (fecha: Date) => {
      const d = new Date(fecha);
      return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    };

    // Función para formatear la fecha
    const formatoFecha = (fecha: Date) => {
      const d = ajustarFecha(fecha);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    // Período del reporte con fechas ajustadas
    doc.setFontSize(12);
    doc.text(`Período: ${formatoFecha(fechaInicio)} - ${formatoFecha(fechaFin)}`, 14, 25);
    
    // Filtrar movimientos por el rango de fechas
    const movimientosFiltrados = movimientos.filter(mov => {
      const fechaMov = new Date(mov.fecha);
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      return fechaMov >= inicio && fechaMov <= fin;
    });

    // Estadísticas generales
    const estadisticas = this.calcularEstadisticas(movimientosFiltrados);
    doc.text(`Total Ingresos: $${estadisticas.totalIngresos.toFixed(2)}`, 14, 35);
    doc.text(`Total Egresos: $${estadisticas.totalEgresos.toFixed(2)}`, 14, 45);
    doc.text(`Balance: $${estadisticas.balance.toFixed(2)}`, 14, 55);
    
    // Tabla de movimientos con fechas ajustadas
    const tableData = movimientosFiltrados.map(mov => [
      formatoFecha(new Date(mov.fecha)),
      mov.tipo,
      mov.descripcion,
      mov.cuentaNombre,
      `$${mov.monto.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: 65,
      head: [['Fecha', 'Tipo', 'Descripción', 'Cuenta', 'Monto']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Gráfico de distribución por categoría
    const categorias = this.agruparPorCategoria(movimientosFiltrados);
    const chartY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.text('Distribución por Categoría', 14, chartY);
    let yPos = chartY + 10;
    
    for (const [categoria, monto] of Object.entries(categorias)) {
      doc.text(`${categoria}: $${monto.toFixed(2)}`, 14, yPos);
      yPos += 10;
    }
    
    // Descargar el PDF con nombre ajustado
    const nombreArchivo = `Reporte_Gastos_${formatoFecha(fechaInicio)}_${formatoFecha(fechaFin)}.pdf`;
    doc.save(nombreArchivo);
  }

  calcularEstadisticas(movimientos: Movimiento[]) {
    const ingresos = movimientos.filter(m => m.tipo === 'INGRESO');
    const egresos = movimientos.filter(m => m.tipo === 'EGRESO');
    
    const totalIngresos = ingresos.reduce((sum, m) => sum + m.monto, 0);
    const totalEgresos = egresos.reduce((sum, m) => sum + m.monto, 0);
    
    return {
      totalIngresos,
      totalEgresos,
      balance: totalIngresos - totalEgresos,
      cantidadIngresos: ingresos.length,
      cantidadEgresos: egresos.length
    };
  }

  agruparPorCategoria(movimientos: Movimiento[]) {
    const categorias: { [key: string]: number } = {};
    
    movimientos.forEach(mov => {
      const categoria = mov.descripcion.split(' ')[0]; // Asumimos que la primera palabra es la categoría
      if (!categorias[categoria]) {
        categorias[categoria] = 0;
      }
      categorias[categoria] += mov.monto;
    });
    
    return categorias;
  }

  filtrarMovimientos(movimientos: Movimiento[], tipo?: 'INGRESO' | 'EGRESO', categoria?: string) {
    let filtrado = [...movimientos];
    
    if (tipo) {
      filtrado = filtrado.filter(m => m.tipo === tipo);
    }
    
    if (categoria) {
      filtrado = filtrado.filter(m => m.descripcion.startsWith(categoria));
    }
    
    return filtrado;
  }
} 