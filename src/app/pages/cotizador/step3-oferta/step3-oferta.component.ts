import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CotizadorDataService } from 'src/app/core/services/cotizador-data.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { CotizadorService } from 'src/app/core/services/cotizador.service';

interface CuotaDetalle {
  nroCuota: number;
  capital: number;
  interes: number;
  iva: number;
  gasto: number;
  cuota: number;
  saldo: number;
}

@Component({
  selector: 'app-step3-oferta',
  templateUrl: './step3-oferta.component.html',
  styleUrls: ['./step3-oferta.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class Step3OfertaComponent implements OnInit {
  @Input() clienteNombre: string = '';
  @Input() clienteApellido: string = '';
  @Input() monto: number = 0;
  @Input() plazo: number = 0;
  @Input() planes: any[] = [];
  @Input() operacionId: number | undefined;
  @Output() seleccionarPlan = new EventEmitter<number>();
  @Output() volver = new EventEmitter<void>();
  @Output() realizarOtraOferta = new EventEmitter<void>();

  showPaymentDetail: boolean = false;
  cuotas: number[] = [];
  tablaAmortizacion: CuotaDetalle[] = [];
  valorCuota: number = 0;
  planSeleccionado: any = {};
  mostrarTablaAmortizacion: boolean = false;
  esRechazado: boolean = false;

  constructor(
    public dataService: CotizadorDataService,
    private sidebarStateService: SidebarStateService,
    private cotizadorService: CotizadorService,
  ) {}

  ngOnInit() {
    this.monto = this.dataService.monto;
    this.plazo = this.dataService.plazo;

    // Usar EXACTAMENTE el mismo valor que se calculó en Step 1
    this.valorCuota = this.dataService.valorCuota;

    this.esRechazado = this.dataService.rechazadoPorBcra;
    if (!this.operacionId && this.dataService.operacionId) {
      this.operacionId = this.dataService.operacionId;
    }

    if (this.esRechazado) {
      return;
    }

    const selectedPlanId = this.dataService.planId;

    if (this.planes && this.planes.length > 0) {
      const planSeleccionado = this.planes.find(plan => plan.id === selectedPlanId);

      if (planSeleccionado) {
        this.planSeleccionado = planSeleccionado;
      } else {
        this.planSeleccionado = this.planes[0];
      }
    } else {
      this.planSeleccionado = {
        nombre: this.dataService.planTipo,
        id: selectedPlanId,
        tasa: this.dataService.tasaAplicada || 0
      };
    }

    // Mostrar la tabla para todos los planes


    // Generar la tabla de amortización
    this.generarCuotas();

    // Si estamos en Plan ID 1, calcular y guardar la cuota promedio
    if (this.planSeleccionado.id === 1) {
      this.calcularYGuardarCuotaPromedio();
      this.mostrarTablaAmortizacion = true;
    }
  }

  // Método para calcular y guardar la cuota promedio
  private calcularYGuardarCuotaPromedio(): void {
    if (this.tablaAmortizacion && this.tablaAmortizacion.length > 1) {
      const cuotas = this.tablaAmortizacion.slice(1).map(fila => fila.cuota);
      const suma = cuotas.reduce((total, cuota) => total + cuota, 0);
      const promedio = Math.round(suma / cuotas.length);

      // Guardar en dataService
      this.dataService.cuotaPromedio = promedio;
      console.log('Cuota promedio calculada y guardada:', promedio);
    }
  }
  toggleSidebar(): void {
    this.sidebarStateService.toggleCotizadorSidebar();
  }

  togglePaymentDetail() {
    this.showPaymentDetail = !this.showPaymentDetail;
  }

  reiniciarCotizador() {
    window.location.reload();
  }

  generarCuotas() {
    const gastosCanal = this.obtenerGastos();
    const tasaAplicada = this.dataService.tasaAplicada || this.planSeleccionado.tasa;

    // IMPORTANTE: Calcular el monto total con gastos para el saldo inicial
    const porcentajeGastos = gastosCanal.reduce((total, gasto) => total + gasto.porcentaje, 0);
    const montoTotal = this.monto * (1 + porcentajeGastos / 100);

    // CUOTA FIJA (principal) - Calcular el valor base para la fórmula francesa
    // En lugar de hardcodear el valor, lo calculamos con la fórmula correcta
    const tasaMensual = tasaAplicada / 100 / 12;
    const factor = Math.pow(1 + tasaMensual, this.plazo);
    // Fórmula francesa para cuota base (sin IVA)
    const cuotaBase = montoTotal * (tasaMensual * factor) / (factor - 1);

    // Iniciar la tabla con el saldo inicial
    this.tablaAmortizacion = [
      {
        nroCuota: 0,
        capital: 0,
        interes: 0,
        iva: 0,
        gasto: 0,
        cuota: 0,
        saldo: montoTotal
      }
    ];

    // Generar todas las filas de la tabla
    let saldoAnterior = montoTotal;

    for (let i = 1; i <= this.plazo; i++) {
      // Interés = Saldo anterior * tasa mensual
      const interesMensual = saldoAnterior * tasaMensual;

      // IVA = 21% del interés
      const ivaMensual = interesMensual * 0.21;

      // Amortización (capital) = Cuota base - Interés
      const capitalMensual = cuotaBase - interesMensual;

      // Cuota total que ve el usuario = cuotaBase + IVA
      const cuotaTotal = cuotaBase + ivaMensual;

      // Nuevo saldo = saldo anterior - capital amortizado
      const nuevoSaldo = Math.max(0, saldoAnterior - capitalMensual);

      // Agregar fila a la tabla
      this.tablaAmortizacion.push({
        nroCuota: i,
        capital: Math.round(capitalMensual),
        interes: Math.round(interesMensual),
        iva: Math.round(ivaMensual),
        gasto: 0,
        cuota: Math.round(cuotaTotal),
        saldo: Math.round(nuevoSaldo)
      });

      // Actualizar saldo para la próxima iteración
      saldoAnterior = nuevoSaldo;
    }

    // Guardar todas las cuotas totales calculadas
    this.cuotas = this.tablaAmortizacion.slice(1).map(fila => fila.cuota);
  }

  private obtenerGastos(): any[] {
    const subcanalInfoGastos = this.dataService.subcanalInfo?.gastos || [];

    if (subcanalInfoGastos.length === 0) {
      return [
        { id: 1, nombre: 'Gasto de gestión', porcentaje: 10 }
      ];
    }

    return subcanalInfoGastos;
  }

  enviarPorWhatsapp() {
    if (this.planSeleccionado && this.planSeleccionado.id) {
      this.seleccionarPlan.emit(this.planSeleccionado.id);
    } else {
      console.error('No hay plan seleccionado para enviar');
    }
  }

  get nombreCompleto(): string {
    return `${this.clienteNombre} ${this.clienteApellido}`;
  }
}
