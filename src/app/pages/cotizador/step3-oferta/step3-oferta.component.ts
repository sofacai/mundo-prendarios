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
    if (this.dataService.planId === 1 && this.dataService.cuotaInicial > 0) {
      this.valorCuota = this.dataService.cuotaInicial;
    } else {
      this.valorCuota = this.dataService.valorCuota;
    }
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

      if (selectedPlanId === 1 && this.dataService.cuotaInicial > 0) {
      } else {
        this.valorCuota = this.planSeleccionado.cuota;
      }
    } else {
      this.planSeleccionado = {
        nombre: this.dataService.planTipo,
        id: selectedPlanId,
        tasa: this.dataService.tasaAplicada || 0
      };
    }

    let planId = this.planSeleccionado.id;
    if (typeof planId === 'string') {
      planId = parseInt(planId, 10);
    }

    this.mostrarTablaAmortizacion = true; // Mostrar siempre la tabla, ya sea sistema alemán o francés

    this.generarCuotas();

    const gastosCanal = this.obtenerGastos();
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
    const antiguedadGrupo = this.dataService.antiguedadGrupo || 'A';
    const tasaAplicada = this.dataService.tasaAplicada || this.planSeleccionado.tasa;
    const planId = this.planSeleccionado.id;

    // Determinar si usamos sistema alemán o francés
    const esSistemaAleman = this.cotizadorService.esSistemaAleman(planId);

    console.log(`Generando cuotas para planId=${planId}, usando ${esSistemaAleman ? 'sistema alemán' : 'sistema francés'}`);
    console.log(`Monto: $${this.monto}, Plazo: ${this.plazo} cuotas, Tasa: ${tasaAplicada}%`);

    if (esSistemaAleman) {
      // Sistema alemán (capital fijo)
      const porcentajeGastos = gastosCanal.reduce((total, gasto) => total + gasto.porcentaje, 0);
      const montoTotal = this.monto * (1 + porcentajeGastos / 100);
      const capitalMensual = Math.round(montoTotal / this.plazo);

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

      let saldoAnterior = montoTotal;

      for (let i = 1; i <= this.plazo; i++) {
        const interesMensual = Math.round(saldoAnterior * ((tasaAplicada / 100) / 360 * 30));
        const ivaMensual = Math.round(interesMensual * 0.21);
        const cuotaMensual = capitalMensual + interesMensual + ivaMensual;
        const nuevoSaldo = saldoAnterior - capitalMensual;

        this.tablaAmortizacion.push({
          nroCuota: i,
          capital: capitalMensual,
          interes: interesMensual,
          iva: ivaMensual,
          gasto: 0,
          cuota: cuotaMensual,
          saldo: nuevoSaldo
        });

        saldoAnterior = nuevoSaldo;
      }

      this.cuotas = this.tablaAmortizacion.slice(1).map(fila => fila.cuota);
    }
    else {
      // Sistema francés (cuota fija)
      // Calculamos la tabla de amortización francesa
      const porcentajeGastos = gastosCanal.reduce((total, gasto) => total + gasto.porcentaje, 0);
      const montoTotal = this.monto * (1 + porcentajeGastos / 100);

      console.log(`Porcentaje total de gastos: ${porcentajeGastos}%`);
      console.log(`Monto total con gastos: $${montoTotal.toLocaleString('es-AR')}`);

      // Tasa mensual (TNA/12)
      const tasaMensual = tasaAplicada / 100 / 12;
      console.log(`Tasa mensual (TNA/12): ${(tasaMensual * 100).toFixed(6)}%`);

      // Calcular cuota fija (sin IVA) usando la fórmula francesa
      // C = P * [i(1+i)^n] / [(1+i)^n - 1]
      const tasaFactor = Math.pow(1 + tasaMensual, this.plazo);
      const cuotaPura = montoTotal * (tasaMensual * tasaFactor) / (tasaFactor - 1);
      console.log(`Cuota pura (sin IVA): $${cuotaPura.toFixed(2)}`);

      // Agregar registro inicial
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

      // Calcular cada cuota
      let saldoAnterior = montoTotal;

      for (let i = 1; i <= this.plazo; i++) {
        // Interés de la cuota = Saldo anterior * tasa mensual
        const interesMensual = saldoAnterior * tasaMensual;

        // IVA = 21% del interés
        const ivaMensual = interesMensual * 0.21;

        // Capital = Cuota pura - Interés
        const capitalMensual = cuotaPura - interesMensual;

        // Cuota total = Cuota pura + IVA
        const cuotaMensual = cuotaPura + ivaMensual;

        // Nuevo saldo = Saldo anterior - Capital amortizado
        const nuevoSaldo = saldoAnterior - capitalMensual;

        // Agregar a la tabla (redondeando valores para evitar decimales)
        this.tablaAmortizacion.push({
          nroCuota: i,
          capital: Math.round(capitalMensual),
          interes: Math.round(interesMensual),
          iva: Math.round(ivaMensual),
          gasto: 0,
          cuota: Math.round(cuotaMensual),
          saldo: Math.round(nuevoSaldo)
        });

        // Actualizar saldo para el próximo cálculo
        saldoAnterior = nuevoSaldo;
      }

      // Obtener las cuotas
      this.cuotas = this.tablaAmortizacion.slice(1).map(fila => fila.cuota);

      // Actualizar valorCuota con la primera cuota
      if (this.tablaAmortizacion.length > 1) {
        this.valorCuota = this.tablaAmortizacion[1].cuota;
      }
    }

    // Impresión de la primera y última cuota para comparación
    if (this.tablaAmortizacion.length > 1) {
      console.log('Primera cuota:');
      console.log(this.tablaAmortizacion[1]);

      console.log('Última cuota:');
      console.log(this.tablaAmortizacion[this.tablaAmortizacion.length - 1]);
    }
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
