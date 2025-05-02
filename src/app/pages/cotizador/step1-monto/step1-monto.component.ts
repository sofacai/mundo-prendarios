// Actualización de step1-monto.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CotizadorService, SubcanalInfo } from 'src/app/core/services/cotizador.service';
import { Router } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { CotizadorDataService, AntiguedadGrupo } from 'src/app/core/services/cotizador-data.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { PlanService } from 'src/app/core/services/plan.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  @Output() continuar = new EventEmitter<{monto: number, plazo: number, antiguedadGrupo: string}>();
  @Output() volver = new EventEmitter<void>();

  monto: number = 0;
  montoFormateado: string = '';
  plazo: number = 60; // Predeterminado a 60 cuotas (se ajustará según disponibilidad)
  plazosDisponibles: number[] = [];
  get plazosOrdenados(): number[] {
    // Ordenamos de mayor a menor para que los plazos más largos estén primero
    return [...this.plazosDisponibles].sort((a, b) => b - a);
  }
  montoMinimo: number = 1000000;
  montoMaximo: number = 30000000;
  planSeleccionado: 'Cuotas Fijas' | 'UVA' = 'UVA'; // Predeterminado a UVA

  // Variables para el manejo de antigüedad del auto
  isAuto0km: boolean = true;
  autoYear: number = new Date().getFullYear(); // Año actual por defecto
  currentYear: number = new Date().getFullYear(); // Para limitar el input de año
  antiguedadGrupo: AntiguedadGrupo = AntiguedadGrupo.A; // Por defecto grupo A (0km-10 años)

  // Planes fijos para las pestañas
  planCuotasFijasId: number = 1;
  planUvaId: number = 2;

  valorCuota: number = 0

  // Valores de los planes (se llenarán a partir de subcanalInfo)
  planCuotasFijas: any = null;
  planUva: any = null;

  errorMensaje: string | null = null;
  cargando: boolean = false;

  // Datos adicionales para el cálculo
  canalGastos: any[] = [];
  subcanalComision: number = 0;

  // Tasas específicas por plazo y antigüedad (se cargarán dinámicamente)
  tasasPorPlazo: {[planId: number]: {[plazo: number]: {tasaA: number, tasaB: number, tasaC: number, activo: boolean}}} = {};

  constructor(
    private router: Router,
    private cotizadorService: CotizadorService,
    private dataService: CotizadorDataService,
    private sidebarStateService: SidebarStateService,
    private planService: PlanService
  ) {}

  ngOnInit() {
    this.cargando = true;

    // Si tenemos información del subcanal, obtenemos límites y plazos de sus planes
    if (this.subcanalInfo && this.subcanalInfo.planesDisponibles && this.subcanalInfo.planesDisponibles.length > 0) {
      const planes = this.subcanalInfo.planesDisponibles;

      // Calculamos los límites globales a partir de todos los planes
      this.montoMinimo = Math.min(...planes.map(plan => plan.montoMinimo));
      this.montoMaximo = Math.max(...planes.map(plan => plan.montoMaximo));

      // Identificar y configurar los planes específicos (Cuotas Fijas y UVA)
      this.planCuotasFijas = planes.find(plan => plan.id === this.planCuotasFijasId);
      this.planUva = planes.find(plan => plan.id === this.planUvaId);

      // Si no se encuentran los planes específicos, usar los primeros disponibles
      if (!this.planCuotasFijas && planes.length > 0) {
        this.planCuotasFijas = planes[0];
        console.warn(`Plan para Cuotas Fijas (ID: ${this.planCuotasFijasId}) no encontrado. Usando plan alternativo ID: ${this.planCuotasFijas.id}`);
      }

      if (!this.planUva && planes.length > 0) {
        this.planUva = planes.length > 1 ? planes[1] : planes[0];
        console.warn(`Plan para UVA (ID: ${this.planUvaId}) no encontrado. Usando plan alternativo ID: ${this.planUva.id}`);
      }

      // Cargar los plazos disponibles de los dos planes específicos
      this.cargarPlazosDisponibles();

      // Guardar los gastos del canal y la comisión del subcanal
      this.canalGastos = this.subcanalInfo.gastos || [];
      if (this.subcanalInfo.subcanalComision !== undefined) {
        this.subcanalComision = this.subcanalInfo.subcanalComision;
      }

      // Cargar las tasas específicas para cada plan y plazo
      this.cargarTasasPorPlazo();
    } else {
      this.errorMensaje = "No se encontraron planes disponibles para este subcanal.";
      this.cargando = false;
    }
  }

 // Método para cargar plazos disponibles según los planes activos
cargarPlazosDisponibles() {
  // Planes a considerar
  const planesSeleccionados = [this.planCuotasFijas, this.planUva].filter(plan => plan);

  // Para cada plan seleccionado, vamos a obtener sus tasas
  const observables = planesSeleccionados.map(plan => {
    return this.planService.getTasasByPlanId(plan.id).pipe(
      map(tasas => {
        // Filtrar solo las tasas activas y extraer sus plazos
        return tasas
          .filter(tasa => tasa.activo) // Filtrar aquí por el campo activo
          .map(tasa => tasa.plazo);
      }),
      catchError(error => {
        console.error(`Error al obtener tasas para el plan ${plan.id}:`, error);
        // En caso de error, usar los plazos definidos en el plan
        return of(plan.cuotasAplicables || []);
      })
    );
  });

  // Combinar los resultados de todos los planes
  forkJoin(observables).subscribe({
    next: (resultados) => {
      // Aplanar el array de arrays y eliminar duplicados
      const todosPlazos = Array.from(new Set(resultados.flat()));

      if (todosPlazos.length > 0) {
        // Ordenar los plazos
        this.plazosDisponibles = todosPlazos.sort((a, b) => a - b);

        // Preseleccionar el plazo más largo disponible
        if (this.plazosDisponibles.includes(this.plazo)) {
          // Si el plazo actual está disponible, mantenerlo
        } else if (this.plazosDisponibles.length > 0) {
          this.plazo = this.plazosDisponibles[this.plazosDisponibles.length - 1];
        }

        // Preseleccionar un monto intermedio entre min y max
        this.monto = Math.round((this.montoMinimo + this.montoMaximo) / 2);
        this.montoFormateado = this.formatearMonto(this.monto);
      } else {
        this.errorMensaje = "No se encontraron plazos disponibles para los planes seleccionados.";
        // Usar plazos predeterminados
        this.plazosDisponibles = [12, 24, 36, 48, 60];
      }

      this.cargando = false;
    },
    error: (error) => {
      console.error('Error al cargar plazos disponibles:', error);
      this.errorMensaje = "Error al cargar los plazos disponibles.";
      // Usar plazos predeterminados en caso de error
      this.plazosDisponibles = [12, 24, 36, 48, 60];
      this.cargando = false;
    }
  });
}

  // Método para cargar las tasas específicas por plazo y antigüedad
  cargarTasasPorPlazo() {
    // Verificar ambos planes y cargar sus tasas
    const planIds = [
      this.planCuotasFijas?.id || this.planCuotasFijasId,
      this.planUva?.id || this.planUvaId
    ];

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
              tasaC: tasa.tasaC,
              activo: tasa.activo
            };
          });
        },
        error: (error) => {
          console.error(`Error al obtener tasas para el plan ${planId}:`, error);
        }
      });
    });
  }

  // Método para obtener la tasa específica según antigüedad y plazo
  obtenerTasaEspecifica(planId: number, plazo: number): number {
    // Si no tenemos las tasas específicas, usar la tasa general del plan
    if (!this.tasasPorPlazo[planId] || !this.tasasPorPlazo[planId][plazo]) {
      const plan = planId === this.planCuotasFijasId ?
                  this.planCuotasFijas : this.planUva;
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

  esPlazoActivo(plazo: number): boolean {
    const planId = this.planSeleccionado === 'Cuotas Fijas' ?
                  (this.planCuotasFijas?.id || this.planCuotasFijasId) :
                  (this.planUva?.id || this.planUvaId);

    // Si no tenemos datos de las tasas para este plan, no está activo
    if (!this.tasasPorPlazo[planId]) {
      return false;
    }

    // Si no tenemos datos para este plazo específico, no está activo
    if (!this.tasasPorPlazo[planId][plazo]) {
      return false;
    }

    // Retornar el valor booleano de activo
    return Boolean(this.tasasPorPlazo[planId][plazo].activo);
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
    const currentYear = this.currentYear;

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
      }
    }

    // Actualizar las cuotas disponibles al cambiar la antigüedad
    // Ya que algunas tasas podrían no estar disponibles para ciertos grupos de antigüedad
    this.actualizarCuotas();
  }

  // Actualizar las cuotas al cambiar el plan o la antigüedad
  actualizarCuotas() {
    // Obtener el planId actual según la pestaña seleccionada
    const planId = this.planSeleccionado === 'Cuotas Fijas' ?
                  (this.planCuotasFijas?.id || this.planCuotasFijasId) :
                  (this.planUva?.id || this.planUvaId);

    // Verificar si hay tasas disponibles para el grupo de antigüedad seleccionado
    if (this.tasasPorPlazo[planId]) {
      const plazoActual = this.plazo;

      // Si el plazo actual no tiene tasa para la antigüedad seleccionada o no está activo,
      // seleccionar otro plazo disponible
      if (!this.tasasPorPlazo[planId][plazoActual] ||
          !this.tasasPorPlazo[planId][plazoActual].activo) {

        const primerPlazoDisponible = this.plazosDisponibles.find(p =>
          this.tasasPorPlazo[planId][p] &&
          this.tasasPorPlazo[planId][p].activo
        );

        if (primerPlazoDisponible) {
          this.plazo = primerPlazoDisponible;
        } else {
          // Si no hay ningún plazo disponible, mostrar error
          this.errorMensaje = "No hay plazos disponibles para la antigüedad seleccionada.";
        }
      }
    }
  }

  seleccionarPlazo(plazo: number) {
    // Verificar si el plazo está activo antes de seleccionarlo
    const planId = this.planSeleccionado === 'Cuotas Fijas' ?
                  (this.planCuotasFijas?.id || this.planCuotasFijasId) :
                  (this.planUva?.id || this.planUvaId);

    if (this.tasasPorPlazo[planId] &&
        this.tasasPorPlazo[planId][plazo] &&
        this.tasasPorPlazo[planId][plazo].activo) {
      this.plazo = plazo;
      this.errorMensaje = null;
    } else {
      this.errorMensaje = "El plazo seleccionado no está disponible para este plan.";
    }
  }

  seleccionarPlan(plan: 'Cuotas Fijas' | 'UVA') {
    this.planSeleccionado = plan;
    // Al cambiar de plan, actualizar las cuotas disponibles
    this.actualizarCuotas();
  }

  calcularCuotaPara(plazo: number): number {
    // Obtener el plan activo según la pestaña seleccionada
    const planActivo = this.planSeleccionado === 'Cuotas Fijas' ? this.planCuotasFijas : this.planUva;
    const planId = this.planSeleccionado === 'Cuotas Fijas' ?
                  (this.planCuotasFijas?.id || this.planCuotasFijasId) :
                  (this.planUva?.id || this.planUvaId);

    if (!planActivo) {
      console.error('No se encontró un plan activo para calcular la cuota');
      return 0;
    }

    try {
      // Obtener la tasa específica según antigüedad y plazo
      const tasa = this.obtenerTasaEspecifica(planId, plazo);

      // Calcular la cuota con el servicio
      return this.cotizadorService.calcularCuota(
        this.monto,
        plazo,
        tasa,
        this.canalGastos
      );
    } catch (error) {
      console.error('Error al calcular la cuota:', error);
      return 0;
    }
  }
  private guardarDatosConCuotas(planId: number, tasa: number, cuotaInicial: number, cuotaPromedio: number) {
    // Guardar los datos en el servicio compartido
    this.dataService.guardarDatosPaso1({
      monto: this.monto,
      plazo: this.plazo,
      planTipo: this.planSeleccionado,
      valorCuota: this.valorCuota,
      planId: planId,
      tasaAplicada: tasa,
      antiguedadGrupo: this.antiguedadGrupo,
      // Añadir los nuevos campos
      cuotaInicial: cuotaInicial,
      cuotaPromedio: cuotaPromedio
    });

    // Guardar el dato del auto en el dataService
    if (this.isAuto0km) {
      this.dataService.auto = "0km";
    } else {
      this.dataService.auto = this.autoYear.toString();
    }

    // Continuar al siguiente paso
    this.continuar.emit({
      monto: this.monto,
      plazo: this.plazo,
      antiguedadGrupo: this.antiguedadGrupo
    });
  }

  onContinuar() {
    if (!this.subcanalInfo || !this.subcanalInfo.planesDisponibles) {
      this.errorMensaje = "No hay planes disponibles.";
      return;
    }

    const planActivoId = this.planSeleccionado === 'Cuotas Fijas' ?
      (this.planCuotasFijas?.id || this.planCuotasFijasId) :
      (this.planUva?.id || this.planUvaId);

    const planActivo = this.subcanalInfo.planesDisponibles.find(plan => plan.id === planActivoId);

    if (!planActivo) {
      this.errorMensaje = "El plan seleccionado no está disponible.";
      return;
    }

    // Validaciones
    const montoValido = this.monto >= planActivo.montoMinimo && this.monto <= planActivo.montoMaximo;
    const plazoValido = planActivo.cuotasAplicables.includes(this.plazo);

    if (!montoValido || !plazoValido) {
      this.errorMensaje = "El monto o plazo seleccionado no está disponible para este plan.";
      return;
    }

    // Verificar tasa activa
    if (this.tasasPorPlazo[planActivoId] &&
        this.tasasPorPlazo[planActivoId][this.plazo] &&
        !this.tasasPorPlazo[planActivoId][this.plazo].activo) {
      this.errorMensaje = "El plazo seleccionado no está activo para este plan.";
      return;
    }

    // Calcular la cuota y guardarla en la propiedad
    this.valorCuota = this.calcularCuotaPara(this.plazo);

    // Obtener tasa específica
    const tasaEspecifica = this.obtenerTasaEspecifica(planActivoId, this.plazo);

    // Plan ID 1 = Tasa Fija (calcular tabla de amortización)
    // Para otros planes, usar valores por defecto
    if (planActivoId === 1) {
      try {
        // Guardar cuota inicial y promedio con los valores actuales
        // en caso de que la tabla falle
        const cuotaInicialDefault = this.valorCuota;
        const cuotaPromedioDefault = this.valorCuota;

        // Evitar que falle el flujo si ocurre un error
        this.dataService.guardarDatosPaso1({
          monto: this.monto,
          plazo: this.plazo,
          planTipo: this.planSeleccionado,
          valorCuota: this.valorCuota,
          planId: planActivoId,
          tasaAplicada: tasaEspecifica,
          antiguedadGrupo: this.antiguedadGrupo,
          cuotaInicial: cuotaInicialDefault,
          cuotaPromedio: cuotaPromedioDefault
        });

        // Guardar dato del auto
        if (this.isAuto0km) {
          this.dataService.auto = "0km";
        } else {
          this.dataService.auto = this.autoYear.toString();
        }

        // Continuar al siguiente paso inmediatamente
        this.continuar.emit({
          monto: this.monto,
          plazo: this.plazo,
          antiguedadGrupo: this.antiguedadGrupo
        });

        // Intentar actualizar cuotas en segundo plano
        // Aunque ocurra un error, el flujo ya continuó
        const gastos = this.subcanalInfo.gastos || [];
        this.cotizadorService.calcularTablaAmortizacionConAntiguedad(
          this.monto, this.plazo, planActivoId, this.antiguedadGrupo, gastos
        ).subscribe(
          tabla => {
            if (tabla && tabla.length > 1) {
              const primeraCuota = tabla.find(fila => fila.nroCuota === 1);
              const cuotas = tabla.filter(fila => fila.nroCuota > 0).map(fila => fila.cuota);

              if (primeraCuota && cuotas.length > 0) {
                const cuotaInicial = primeraCuota.cuota;
                const cuotaPromedio = cuotas.reduce((sum, cuota) => sum + cuota, 0) / cuotas.length;

                this.dataService.cuotaInicial = cuotaInicial;
                this.dataService.cuotaPromedio = cuotaPromedio;
              }
            }
          },
          error => {
            console.error('Error al calcular tabla de amortización:', error);
            // No mostrar error al usuario, ya que el flujo continuó
          }
        );
      } catch (error) {
        this.guardarDatosConCuotas(planActivoId, tasaEspecifica, this.valorCuota, this.valorCuota);
      }
    } else {
      this.guardarDatosConCuotas(planActivoId, tasaEspecifica, 0, 0);
    }
  }
}
