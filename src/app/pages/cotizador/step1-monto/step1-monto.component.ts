// Modificación de step1-monto.component.ts - Método calcularCuotaPara
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

  monto: number = 1000000;
  montoFormateado: string = '1.000.000';
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
  antiguedadGrupo: AntiguedadGrupo = AntiguedadGrupo.A; // Por defecto grupo A (0km-8 años)

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
    public dataService: CotizadorDataService,
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
      }

      if (!this.planUva && planes.length > 0) {
        this.planUva = planes.length > 1 ? planes[1] : planes[0];
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

cargarPlazosDisponibles() {
  // Planes a considerar
  const planesSeleccionados = [this.planCuotasFijas, this.planUva].filter(plan => plan);

  // Para cada plan seleccionado, vamos a obtener sus tasas
  const observables = planesSeleccionados.map(plan => {
    return this.planService.getTasasByPlanId(plan.id).pipe(
      map(tasas => {
        // Filtrar por tasas activas y que tengan tasa válida para el grupo de antigüedad actual
        return tasas
          .filter(tasa => {
            // Primero verificar que esté activo
            if (!tasa.activo) return false;

            // Luego verificar que tenga tasa válida para el grupo de antigüedad
            switch (this.antiguedadGrupo) {
              case AntiguedadGrupo.A:
                return tasa.tasaA > 0;
              case AntiguedadGrupo.B:
                return tasa.tasaB > 0;
              case AntiguedadGrupo.C:
                return tasa.tasaC > 0;
              default:
                return tasa.tasaA > 0;
            }
          })
          .map(tasa => tasa.plazo);
      }),
      catchError(error => {
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

        // ELIMINADO: Ya no reiniciamos el monto cada vez que cambia la antigüedad
        // this.monto = 1000000;
        // this.montoFormateado = this.formatearMonto(this.monto);

        // Mostrar en consola los plazos disponibles para debug
      } else {
        this.errorMensaje = "No se encontraron plazos disponibles para los planes seleccionados con la antigüedad del auto actual.";
        // Usar plazos predeterminados
        this.plazosDisponibles = [12, 24, 36, 48, 60];
      }

      this.cargando = false;
    },
    error: (error) => {
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
        }
      });
    });
  }

  obtenerTasaEspecifica(planId: number, plazo: number): number {


    // Si no tenemos las tasas específicas, usar la tasa general del plan
    if (!this.tasasPorPlazo[planId] || !this.tasasPorPlazo[planId][plazo]) {
      const plan = planId === this.planCuotasFijasId ? this.planCuotasFijas : this.planUva;
      return plan ? plan.tasa : 0;
    }

    // Obtener la tasa según el grupo de antigüedad
    const tasasPlazo = this.tasasPorPlazo[planId][plazo];
    let tasaSeleccionada = 0;

    switch (this.antiguedadGrupo) {
      case AntiguedadGrupo.A:
        tasaSeleccionada = tasasPlazo.tasaA;
        break;
      case AntiguedadGrupo.B:
        tasaSeleccionada = tasasPlazo.tasaB;
        break;
      case AntiguedadGrupo.C:
        tasaSeleccionada = tasasPlazo.tasaC;
        break;
      default:
        tasaSeleccionada = tasasPlazo.tasaA;
    }

    return tasaSeleccionada;
  }

  esPlazoActivo(plazo: number): boolean {
    // Si el plazo es 60 y el auto NO está en el grupo A (0km-8 años), debe ocultarse
    if (plazo === 60 && this.antiguedadGrupo !== AntiguedadGrupo.A) {
      return false;
    }

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

    // Verificar que esté activo y tenga tasa válida para el grupo de antigüedad actual
    const tasasPlazo = this.tasasPorPlazo[planId][plazo];

    if (!tasasPlazo.activo) {
      return false;
    }

    // Verificar que tenga tasa válida para el grupo de antigüedad
    switch (this.antiguedadGrupo) {
      case AntiguedadGrupo.A:
        return tasasPlazo.tasaA > 0;
      case AntiguedadGrupo.B:
        return tasasPlazo.tasaB > 0;
      case AntiguedadGrupo.C:
        return tasasPlazo.tasaC > 0;
      default:
        return tasasPlazo.tasaA > 0;
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
      if (antiguedadAnios <= 8) { // 0-8 años (2017-2025)
        this.antiguedadGrupo = AntiguedadGrupo.A;
      } else if (antiguedadAnios <= 10) { // 9-10 años (2015-2016)
        this.antiguedadGrupo = AntiguedadGrupo.B;
      } else if (antiguedadAnios <= 15) { // 11-15 años (2010-2014)
        this.antiguedadGrupo = AntiguedadGrupo.C;
      }
    }


    // Recargar los plazos disponibles según la nueva antigüedad
    this.cargarPlazosDisponibles();

    // Si el plazo actual es 60 y el auto no está en el grupo A, seleccionar otro plazo
    if (this.plazo === 60 && this.antiguedadGrupo !== AntiguedadGrupo.A) {
      // Buscar el plazo más largo disponible que no sea 60
      const plazosDisponiblesOrdenados = [...this.plazosOrdenados].filter(p => p !== 60);
      if (plazosDisponiblesOrdenados.length > 0) {
        this.plazo = plazosDisponiblesOrdenados[0]; // Seleccionar el plazo más largo disponible
      }
    }

    // Actualizar las cuotas disponibles al cambiar la antigüedad
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

    // Set the correct plan ID based on the selected plan type
    const planId = plan === 'Cuotas Fijas' ?
                 (this.planCuotasFijas?.id || this.planCuotasFijasId) :
                 (this.planUva?.id || this.planUvaId);

    // Store the selected plan ID in the data service
    this.dataService.planId = planId;

    // Rest of the method...
    this.actualizarCuotas();
  }

  calcularCuotaPara(plazo: number): number {
    // Obtener el plan activo según la pestaña seleccionada
    const planActivo = this.planSeleccionado === 'Cuotas Fijas' ? this.planCuotasFijas : this.planUva;
    const planId = this.planSeleccionado === 'Cuotas Fijas' ?
                  (this.planCuotasFijas?.id || this.planCuotasFijasId) :
                  (this.planUva?.id || this.planUvaId);

    if (!planActivo) {
      return 0;
    }

    try {
      // Obtener la tasa específica según antigüedad y plazo
      const tasaAnual = this.obtenerTasaEspecifica(planId, plazo);

      // USAR EXACTAMENTE EL MISMO MÉTODO PARA AMBOS PLANES
      return this.cotizadorService.calcularCuota(
        this.monto,
        plazo,
        tasaAnual,
        this.canalGastos
      );
    } catch (error) {
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

    // Para TODOS los planes, guardar la cuota inicial y la cuota promedio
    // con el valor actual de la cuota calculada
    this.dataService.guardarDatosPaso1({
      monto: this.monto,
      plazo: this.plazo,
      planTipo: this.planSeleccionado,
      valorCuota: this.valorCuota,
      planId: planActivoId,
      tasaAplicada: tasaEspecifica,
      antiguedadGrupo: this.antiguedadGrupo,
      // Guardar siempre la cuota inicial para todos los planes
      cuotaInicial: this.valorCuota,
      // Por defecto, usar el mismo valor de cuota
      cuotaPromedio: this.valorCuota
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

    // Solo para el Plan ID 1 (Tasa Fija), intentar calcular una tabla de amortización más precisa
    // pero continuar aunque falle este cálculo
    if (planActivoId === 1) {
      try {
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

          }
        );
      } catch (error) {
      }
    }
  }
}
