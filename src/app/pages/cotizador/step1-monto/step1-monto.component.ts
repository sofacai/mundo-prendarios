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
import { PlanService } from 'src/app/core/services/plan.service';
registerLocaleData(localeEs, 'es');

// Enumeración para manejo de antigüedad
export enum AntiguedadGrupo {
  A = 'A', // 0km a 10 años
  B = 'B', // 11 a 12 años
  C = 'C'  // 13 a 15 años
}

@Component({
  selector: 'app-step1-monto',
  templateUrl: './step1-monto.component.html',
  styleUrls: ['./step1-monto.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class Step1MontoComponent implements OnInit {
  @Input() subcanalInfo: SubcanalInfo | null = null;
  @Output() continuar = new EventEmitter<{monto: number, plazo: number, antiguedadGrupo: string}>();
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

  // Variables para el manejo de antigüedad del auto
  isAuto0km: boolean = true;
  autoYear: number = new Date().getFullYear(); // Año actual por defecto
  currentYear: number = new Date().getFullYear(); // Para limitar el input de año
  antiguedadGrupo: AntiguedadGrupo = AntiguedadGrupo.A; // Por defecto grupo A (0km-10 años)

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

  // Tasas específicas por plazo y antigüedad (se cargarán dinámicamente)
  tasasPorPlazo: {[planId: number]: {[plazo: number]: {tasaA: number, tasaB: number, tasaC: number}}} = {};

  constructor(
    private router: Router,
    private cotizadorService: CotizadorService,
    private dataService: CotizadorDataService,
    private sidebarStateService: SidebarStateService,
    private planService: PlanService
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
      }

      // Guardamos los gastos del canal
      this.canalGastos = this.subcanalInfo.gastos || [];

      // Obtenemos la comisión del subcanal si existe
      if (this.subcanalInfo.subcanalComision !== undefined) {
        this.subcanalComision = this.subcanalInfo.subcanalComision;
      }

      // Cargar las tasas específicas para cada plan y plazo
      this.cargarTasasPorPlazo();



    } else {
      this.errorMensaje = "No se encontraron planes disponibles para este subcanal.";
    }
  }



  // Método para cargar las tasas específicas por plazo y antigüedad
  cargarTasasPorPlazo() {
    // Verificar ambos planes y cargar sus tasas
    const planIds = [this.planCuotasFijasId, this.planUvaId];

    planIds.forEach(planId => {
      if (!planId) return;

      // Obtener las tasas para este plan
      this.planService.getTasasByPlanId(planId).subscribe({
        next: (tasas) => {
          // Inicializar objeto para este plan si no existe
          if (!this.tasasPorPlazo[planId]) {
            this.tasasPorPlazo[planId] = {};
          }

          // Guardar las tasas por plazo
          tasas.forEach(tasa => {
            this.tasasPorPlazo[planId][tasa.plazo] = {
              tasaA: tasa.tasaA,
              tasaB: tasa.tasaB,
              tasaC: tasa.tasaC
            };
          });

        },
        error: (error) => {
        }
      });
    });
  }

  // Método para obtener la tasa específica según antigüedad y plazo
  obtenerTasaEspecifica(planId: number, plazo: number): number {
    // Si no tenemos las tasas específicas, usar la tasa general del plan
    if (!this.tasasPorPlazo[planId] || !this.tasasPorPlazo[planId][plazo]) {
      const plan = planId === this.planCuotasFijasId ? this.planCuotasFijas : this.planUva;
      return plan ? plan.tasa : 0;
    }

    // Obtener la tasa según el grupo de antigüedad
    const tasasPlazo = this.tasasPorPlazo[planId][plazo];
    switch (this.antiguedadGrupo) {
      case AntiguedadGrupo.A:
        return tasasPlazo.tasaA;
      case AntiguedadGrupo.B:
        return tasasPlazo.tasaB;
      case AntiguedadGrupo.C:
        return tasasPlazo.tasaC;
      default:
        return tasasPlazo.tasaA; // Por defecto, usar tasa A
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

  // Método para manejar cambios en la antigüedad del auto
  onAutoAntiguedadChange() {
    const currentYear = new Date().getFullYear();

    if (this.isAuto0km) {
      // Si es 0km, siempre es grupo A
      this.antiguedadGrupo = AntiguedadGrupo.A;
      this.autoYear = currentYear; // Actualizar el año al actual
      this.errorMensaje = null;
    } else {
      // Validar que el año esté dentro del rango permitido (hasta 15 años de antigüedad)
      if (this.autoYear < currentYear - 15 || this.autoYear > currentYear) {
        if (this.autoYear < currentYear - 15) {
          this.autoYear = currentYear - 15; // Ajustar al mínimo permitido
        } else if (this.autoYear > currentYear) {
          this.autoYear = currentYear; // Ajustar al máximo permitido
        }
      }

      // Calcular la antigüedad en años
      const antiguedadAnios = currentYear - this.autoYear;

      // Asignar grupo según la antigüedad
      if (antiguedadAnios <= 10) { // 0-10 años (2015-2025)
        this.antiguedadGrupo = AntiguedadGrupo.A;
      } else if (antiguedadAnios <= 12) { // 11-12 años (2013-2014)
        this.antiguedadGrupo = AntiguedadGrupo.B;
      } else if (antiguedadAnios <= 15) { // 13-15 años (2010-2012)
        this.antiguedadGrupo = AntiguedadGrupo.C;
      } else {
        // Este caso no debería ocurrir por la validación anterior
        this.antiguedadGrupo = AntiguedadGrupo.C;
      }
    }

    // Obtener y mostrar las tasas disponibles para el grupo de antigüedad
    const planId = this.planSeleccionado === 'Cuotas Fijas' ? this.planCuotasFijasId : this.planUvaId;

    if (this.tasasPorPlazo[planId] && this.tasasPorPlazo[planId][this.plazo]) {
      const tasasDisponibles = this.tasasPorPlazo[planId][this.plazo];


      let tasaAplicada = 0;
      switch (this.antiguedadGrupo) {
        case AntiguedadGrupo.A:
          tasaAplicada = tasasDisponibles.tasaA;
          break;
        case AntiguedadGrupo.B:
          tasaAplicada = tasasDisponibles.tasaB;
          break;
        case AntiguedadGrupo.C:
          tasaAplicada = tasasDisponibles.tasaC;
          break;
      }
    } else {

    }
  }

  // Método para obtener texto descriptivo del grupo de antigüedad
  getAntiguedadTexto(): string {
    const currentYear = new Date().getFullYear();
    const antiguedadAnios = currentYear - this.autoYear;

    switch (this.antiguedadGrupo) {
      case AntiguedadGrupo.A:
        return `${antiguedadAnios} años (Grupo A)`;
      case AntiguedadGrupo.B:
        return `${antiguedadAnios} años (Grupo B)`;
      case AntiguedadGrupo.C:
        return `${antiguedadAnios} años (Grupo C)`;
      default:
        return `${antiguedadAnios} años`;
    }
  }

  seleccionarPlazo(plazo: number) {
    this.plazo = plazo;
  }

  seleccionarPlan(plan: 'Cuotas Fijas' | 'UVA') {
    this.planSeleccionado = plan;

    // Comprobar planId correspondiente
    const planId = this.planSeleccionado === 'Cuotas Fijas'
      ? this.planCuotasFijasId
      : this.planUvaId;

  }

  calcularCuotaPara(plazo: number): number {
    // Obtener el plan activo según la pestaña seleccionada
    const planActivo = this.planSeleccionado === 'Cuotas Fijas' ? this.planCuotasFijas : this.planUva;
    const planId = this.planSeleccionado === 'Cuotas Fijas' ? this.planCuotasFijasId : this.planUvaId;

    if (!planActivo) {
      console.error('No se encontró un plan activo para calcular la cuota');
      return 0;
    }

    try {
      // 1. Obtener la tasa específica según antigüedad y plazo
      const tasa = this.obtenerTasaEspecifica(planId, plazo);

      // Solo loguear cuando es el plazo seleccionado
      if (plazo === this.plazo) {
        const porcentajeGastos = this.canalGastos.reduce((total, gasto) => total + gasto.porcentaje, 0);
        const montoConGastos = this.monto * (1 + porcentajeGastos / 100);
        const capitalMensual = Math.round(montoConGastos / plazo);
        const interesMensual = Math.round(montoConGastos * ((tasa / 100) / 360 * 30));
        const ivaMensual = Math.round(interesMensual * 0.21);
      }

      // 2. Calcular la cuota con el servicio
      return this.cotizadorService.calcularCuota(
        this.monto,
        plazo,
        tasa,
        this.canalGastos
      );
    } catch (error) {
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

      // Calcular el valor de la cuota para el plan seleccionado con la tasa específica
      const valorCuota = this.calcularCuotaPara(this.plazo);

      // Obtener la tasa específica
      const tasaEspecifica = this.obtenerTasaEspecifica(planActivoId, this.plazo);

      // Guardar los datos en el servicio compartido
      this.dataService.guardarDatosPaso1({
        monto: this.monto,
        plazo: this.plazo,
        planTipo: this.planSeleccionado,
        valorCuota: valorCuota,
        planId: planActivo.id,
        tasaAplicada: tasaEspecifica,
        antiguedadGrupo: this.antiguedadGrupo
      });

      // Guardar el dato del auto en el dataService
      if (this.isAuto0km) {
        this.dataService.auto = "0km";
      } else {
        this.dataService.auto = this.autoYear.toString();
      }



    } else {
      this.errorMensaje = "El plan seleccionado no está disponible.";
      return;
    }

    // Continuar al siguiente paso
    this.continuar.emit({
      monto: this.monto,
      plazo: this.plazo,
      antiguedadGrupo: this.antiguedadGrupo
    });
  }
}
