// Cambios necesarios para step1-monto.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CotizadorService, SubcanalInfo } from 'src/app/core/services/cotizador.service';
import { Router } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { CotizadorDataService } from 'src/app/core/services/cotizador-data.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-step1-monto',
  templateUrl: './step1-monto.component.html',
  styleUrls: ['./step1-monto.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class Step1MontoComponent implements OnInit {
  @Input() subcanalInfo: SubcanalInfo | null = null;
  @Output() continuar = new EventEmitter<{monto: number, plazo: number}>();
  @Output() volver = new EventEmitter<void>();

  monto: number = 1000000;
  montoFormateado: string = '1.000.000';
  plazo: number = 60; // Predeterminado a 60 cuotas
  plazosDisponibles: number[] = [12, 24, 36, 48, 60];
  get plazosOrdenados(): number[] {
    // Ordenamos de mayor a menor para que 60 esté primero y 12 al final
    return [...this.plazosDisponibles].sort((a, b) => b - a);
  }
  montoMinimo: number = 50000;
  montoMaximo: number = 5000000;
  planSeleccionado: 'Cuotas Fijas' | 'UVA' = 'UVA'; // Predeterminado a UVA como en la imagen

  // Planes fijos para las pestañas
  planCuotasFijasId: number = 1;
  planUvaId: number = 2;

  // Valores de los planes (se llenarán a partir de subcanalInfo)
  planCuotasFijas: any = null;
  planUva: any = null;

  errorMensaje: string | null = null;

  // Datos adicionales para el cálculo
  canalGastos: any[] = [];
  subcanalComision: number = 0;

  constructor(
    private router: Router,
    private cotizadorService: CotizadorService,
    private dataService: CotizadorDataService,
    private sidebarStateService: SidebarStateService


  ) {}

  ngOnInit() {
    // Si tenemos información del subcanal, obtenemos límites y plazos de sus planes
    if (this.subcanalInfo && this.subcanalInfo.planesDisponibles && this.subcanalInfo.planesDisponibles.length > 0) {
      const planes = this.subcanalInfo.planesDisponibles;

      // Calculamos los límites globales a partir de todos los planes
      this.montoMinimo = Math.min(...planes.map(plan => plan.montoMinimo));
      this.montoMaximo = Math.max(...planes.map(plan => plan.montoMaximo));

      // Obtenemos todos los plazos disponibles sin duplicados
      const todosPlazos: number[] = [];
      planes.forEach(plan => {
        plan.cuotasAplicables.forEach((cuota: number) => {
          todosPlazos.push(cuota);
        });
      });
      this.plazosDisponibles = [...new Set(todosPlazos)].sort((a, b) => a - b);

      // Preseleccionamos 60 cuotas si está disponible
      if (this.plazosDisponibles.includes(60)) {
        this.plazo = 60;
      } else if (this.plazosDisponibles.length > 0) {
        this.plazo = this.plazosDisponibles[this.plazosDisponibles.length - 1]; // El mayor plazo disponible
      }

      // Preseleccionamos un monto intermedio entre min y max
      this.monto = Math.round((this.montoMinimo + this.montoMaximo) / 2);
      this.montoFormateado = this.formatearMonto(this.monto);

      // Guardamos los planes específicos
      this.planCuotasFijas = planes.find(plan => plan.id === this.planCuotasFijasId);
      this.planUva = planes.find(plan => plan.id === this.planUvaId);

      // Si no se encuentran los planes específicos, usamos los primeros disponibles
      if (!this.planCuotasFijas) {
        this.planCuotasFijas = planes[0];
        console.warn(`Plan para Cuotas Fijas (ID: ${this.planCuotasFijasId}) no encontrado. Usando plan alternativo ID: ${this.planCuotasFijas.id}`);
      }

      if (!this.planUva) {
        this.planUva = planes.length > 1 ? planes[1] : planes[0];
        console.warn(`Plan para UVA (ID: ${this.planUvaId}) no encontrado. Usando plan alternativo ID: ${this.planUva.id}`);
      }

      // Guardamos los gastos del canal
      this.canalGastos = this.subcanalInfo.gastos || [];

      // Obtenemos la comisión del subcanal si existe
      if (this.subcanalInfo.subcanalComision !== undefined) {
        this.subcanalComision = this.subcanalInfo.subcanalComision;
      }

      console.log('Subcanal Info:', this.subcanalInfo);
      console.log('Planes disponibles:', planes);
      console.log('Plan Cuotas Fijas:', this.planCuotasFijas);
      console.log('Plan UVA:', this.planUva);
      console.log('Gastos del canal:', this.canalGastos);
      console.log('Comisión del subcanal:', this.subcanalComision);
    } else {
      this.errorMensaje = "No se encontraron planes disponibles para este subcanal.";
    }
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleCotizadorSidebar();
  }

  onVolver() {
    this.volver.emit();
  }

  // Formateador de números con puntos para los miles
  formatearMonto(monto: number): string {
    return monto.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Convertir valor formateado a número
  desformatearMonto(montoStr: string): number {
    return parseInt(montoStr.replace(/\./g, '')) || 0;
  }

  onMontoInputChange(event: any) {
    // Extraer solo los dígitos del input
    let inputVal = event.target.value.replace(/\D/g, '');

    // Convertir a número
    const numero = parseInt(inputVal) || 0;

    // Actualizar el valor interno
    this.monto = numero;

    // Formatear con puntos de miles
    this.montoFormateado = this.formatearMonto(numero);

    // Asegurar que el valor formateado se muestre en el input
    event.target.value = this.montoFormateado;
  }

  seleccionarPlazo(plazo: number) {
    this.plazo = plazo;
  }

  seleccionarPlan(plan: 'Cuotas Fijas' | 'UVA') {
    console.log(`Cambiando plan de ${this.planSeleccionado} a ${plan}`);
    this.planSeleccionado = plan;
  }

  calcularCuotaPara(plazo: number): number {
    // Obtener el plan activo según la pestaña seleccionada
    const planActivo = this.planSeleccionado === 'Cuotas Fijas' ? this.planCuotasFijas : this.planUva;

    if (!planActivo) {
      console.error('No se encontró un plan activo para calcular la cuota');
      return 0;
    }

    console.log(`Calculando cuota para plan "${this.planSeleccionado}" con tasa ${planActivo.tasa}%`);

    try {
      // 1. Obtener cuota básica según la tasa del plan seleccionado
      let montoTotal = this.monto;

      // 2. Calcular la cuota mensual con el servicio
      const cuotaBasica = this.cotizadorService.calcularCuota(
        montoTotal,
        plazo,
        planActivo.tasa,  // Usar la tasa del plan seleccionado (Cuotas Fijas o UVA)
        this.canalGastos
      );

      // 3. Aplicar comisión del subcanal si existe
      let cuotaFinal = cuotaBasica;
      if (this.subcanalComision > 0) {
        cuotaFinal = Math.round(cuotaFinal * (1 + this.subcanalComision / 100));
        console.log(`Aplicando comisión de subcanal ${this.subcanalComision}%: ${cuotaBasica} → ${cuotaFinal}`);
      }

      return cuotaFinal;
    } catch (error) {
      console.error('Error al calcular cuota:', error);
      return 0;
    }
  }

  onContinuar() {
    if (!this.subcanalInfo || !this.subcanalInfo.planesDisponibles) {
      this.errorMensaje = "No hay planes disponibles.";
      return;
    }

    // Determinar qué plan se está usando actualmente
    const planActivoId = this.planSeleccionado === 'Cuotas Fijas'
      ? this.planCuotasFijasId
      : this.planUvaId;

    // Buscar el plan activo
    const planActivo = this.subcanalInfo.planesDisponibles.find(plan => plan.id === planActivoId);

    // Validar si el monto y plazo están dentro del plan seleccionado
    if (planActivo) {
      const montoValido = this.monto >= planActivo.montoMinimo && this.monto <= planActivo.montoMaximo;
      const plazoValido = planActivo.cuotasAplicables.includes(this.plazo);

      if (!montoValido || !plazoValido) {
        this.errorMensaje = "El monto o plazo seleccionado no está disponible para este plan.";
        return;
      }

      // Calcular el valor de la cuota para el plan seleccionado
      const valorCuota = this.calcularCuotaPara(this.plazo);

      // Guardar los datos en el servicio compartido
      this.dataService.guardarDatosPaso1({
        monto: this.monto,
        plazo: this.plazo,
        planTipo: this.planSeleccionado,
        valorCuota: valorCuota,
        planId: planActivo.id
      });

    } else {
      this.errorMensaje = "El plan seleccionado no está disponible.";
      return;
    }

    // Continuar al siguiente paso
    this.continuar.emit({
      monto: this.monto,
      plazo: this.plazo
    });
  }
}
