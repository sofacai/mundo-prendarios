// Actualizar Step3OfertaComponent para mostrar tabla de amortización
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
  @Output() seleccionarPlan = new EventEmitter<number>();
  @Output() volver = new EventEmitter<void>();
  @Output() realizarOtraOferta = new EventEmitter<void>();

  showPaymentDetail: boolean = false;
  cuotas: number[] = [];
  tablaAmortizacion: CuotaDetalle[] = [];
  valorCuota: number = 0;
  planSeleccionado: any = {};
  mostrarTablaAmortizacion: boolean = false;

  constructor(
    private dataService: CotizadorDataService,
    private sidebarStateService: SidebarStateService,
    private cotizadorService: CotizadorService
  ) {}

 // En step3-oferta.component.ts - modificar ngOnInit()

ngOnInit() {
  // Obtener datos del servicio compartido primero
  this.monto = this.dataService.monto;
  this.plazo = this.dataService.plazo;
  this.valorCuota = this.dataService.valorCuota;

  // Identificar el planId seleccionado en step1
  const selectedPlanId = this.dataService.planId;
  console.log('Step3 - planId seleccionado en step1:', selectedPlanId);

  // Si hay planes disponibles, buscar el plan correspondiente
  if (this.planes && this.planes.length > 0) {
    // Buscar el plan que coincida con el seleccionado en step1
    const planSeleccionado = this.planes.find(plan => plan.id === selectedPlanId);

    // Si se encuentra, usarlo; si no, usar el primero de la lista
    if (planSeleccionado) {
      this.planSeleccionado = planSeleccionado;
      console.log('Step3 - Usando plan seleccionado en step1:', this.planSeleccionado);
    } else {
      this.planSeleccionado = this.planes[0];
      console.log('Step3 - Plan no encontrado, usando el primero:', this.planSeleccionado);
    }

    this.valorCuota = this.planSeleccionado.cuota;
  } else {
    // Si no hay planes disponibles, usar los datos del servicio
    this.planSeleccionado = {
      nombre: this.dataService.planTipo,
      id: selectedPlanId,
      tasa: 0 // Valor por defecto
    };

    console.log('Step3 - Usando datos desde dataService (sin planes):', this.planSeleccionado);
  }

  // Obtener el planId numérico
  let planId = this.planSeleccionado.id;
  if (typeof planId === 'string') {
    planId = parseInt(planId, 10);
  }

  console.log('Step3 - planId definitivo:', planId);

  // Verificar si es plan con sistema alemán (planId = 1)
  this.mostrarTablaAmortizacion = this.cotizadorService.esSistemaAleman(planId);

  // Generar la tabla de amortización o cuotas simples según corresponda
  this.generarCuotas();

  // Imprimir datos de cálculo en consola
  const gastosCanal = this.obtenerGastos();
  console.log('--- DATOS DE CÁLCULO AMORTIZACIÓN ---');
  console.log('Plan ID:', this.planSeleccionado.id);
  console.log('Nombre plan:', this.planSeleccionado.nombre);
  console.log('Monto solicitado:', this.monto);
  console.log('Meses:', this.plazo);
  console.log('TNA:', this.planSeleccionado.tasa, '%');
  console.log('Gastos del canal:', gastosCanal);
  console.log('Mostrar tabla amortización:', this.mostrarTablaAmortizacion);
  console.log('----------------------------------');
}

  toggleSidebar(): void {
    this.sidebarStateService.toggleCotizadorSidebar();
  }

  togglePaymentDetail() {
    this.showPaymentDetail = !this.showPaymentDetail;
  }

  generarCuotas() {
    // Verificar si es un plan con sistema alemán
    if (this.mostrarTablaAmortizacion) {
      // Obtener gastos del canal de la subcanalInfo almacenada
      const gastosCanal = this.obtenerGastos();

      // Generar tabla de amortización sistema alemán
      this.tablaAmortizacion = this.cotizadorService.calcularTablaAmortizacion(
        this.monto,
        this.plazo,
        this.planSeleccionado.tasa,
        gastosCanal
      );

      // Las cuotas para el resumen principal se toman de la tabla
      this.cuotas = this.tablaAmortizacion.slice(1).map(fila => fila.cuota);
    } else {
      // Para planes no alemanes, todas las cuotas son iguales
      this.cuotas = Array(this.plazo).fill(this.valorCuota);
    }
  }

  private obtenerGastos(): any[] {
    // Intentar obtener los gastos del subcanal seleccionado
    // Si hay un wizard container con subcanalSeleccionadoInfo, usar sus gastos
    const subcanalInfoGastos = this.dataService.subcanalInfo?.gastos || [];

    // Si no hay gastos y hay un gasto de gestión registrado, crearlo manualmente
    if (subcanalInfoGastos.length === 0) {
      return [
        { id: 1, nombre: 'Gasto de gestión', porcentaje: 10 } // Valor por defecto
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

  // Helper para mostrar el nombre completo
  get nombreCompleto(): string {
    return `${this.clienteNombre} ${this.clienteApellido}`;
  }
}
