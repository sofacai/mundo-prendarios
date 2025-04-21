import { Step1MontoComponent } from '../step1-monto/step1-monto.component';
import { Step2DatosComponent } from '../step2-datos/step2-datos.component';
import { Step3OfertaComponent } from '../step3-oferta/step3-oferta.component';
import { SubcanalSelectorComponent } from "../subcanal-selector/subcanal-selector.component";
import { RolType } from 'src/app/core/models/usuario.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatosWizard, SubcanalInfo, CotizadorService } from 'src/app/core/services/cotizador.service';
import { ClienteService, Cliente, ClienteCrearDto } from 'src/app/core/services/cliente.service';
import { OperacionService, Operacion } from 'src/app/core/services/operacion.service';
import { ClienteVendorService } from 'src/app/core/services/cliente-vendor.service';
import { CotizadorDataService } from 'src/app/core/services/cotizador-data.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { VendorSelectorComponent } from "../vendor-selector/vendor-selector.component";
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { catchError, finalize, tap, map, switchMap } from 'rxjs/operators';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { CanalService } from 'src/app/core/services/canal.service';
import { PlanService } from 'src/app/core/services/plan.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { KommoLeadService } from 'src/app/core/services/kommo-lead.service';
import { KommoService } from '../../../core/services/kommo.service';
import { HttpHeaders } from '@angular/common/http';
import { BcraService } from '../../../core/services/bcra.service';



interface WizardData {
  paso: number;
  monto?: number;
  plazo?: number;
  clienteId?: number;
  clienteNombre?: string;
  clienteApellido?: string;
  clienteWhatsapp?: string;
  clienteEmail?: string;
  clienteDni?: string;
  clienteCuil?: string;
  clienteSexo?: string;
  // Nuevos campos
  ingresos?: number;
  auto?: string;
  codigoPostal?: number;
  estadoCivil?: string;
  planesDisponibles?: any[];
  operacionId?: number;
  vendorId?: number;
}

@Component({
  selector: 'app-wizard-container',
  templateUrl: './wizard-container.component.html',
  styleUrls: ['./wizard-container.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, Step1MontoComponent, Step2DatosComponent, SubcanalSelectorComponent, Step3OfertaComponent, VendorSelectorComponent]
})
export class WizardContainerComponent implements OnInit {
  wizardData: WizardData = { paso: 1 };
  cargando: boolean = false;
  error: string | null = null;

  datosWizard: DatosWizard | null = null;
  necesitaSeleccionarSubcanal: boolean = false;
  subcanalSeleccionado: number | null = null;
  subcanalSeleccionadoInfo: SubcanalInfo | null = null;
  gastosSeleccionados: any[] = [];

  necesitaSeleccionarVendor: boolean = false;
  vendors: any[] = [];
  currentUserRol: RolType = RolType.Vendor;
  vendorSeleccionado: number | null = null;
  subcanales: Subcanal[] = [];

  private yaCreoLeadEnKommo = false;


  constructor(
    private authService: AuthService,
    private cotizadorService: CotizadorService,
    private clienteService: ClienteService,
    private clienteVendorService: ClienteVendorService,
    private operacionService: OperacionService,
    private dataService: CotizadorDataService,
    private usuarioService: UsuarioService,
    private subcanalService: SubcanalService,
    private cdr: ChangeDetectorRef,
    private canalService: CanalService,
    private planService: PlanService,
    private sidebarStateService: SidebarStateService,
    private kommoLeadService: KommoLeadService,
    private KommoService: KommoService,
    private BcraService:BcraService


  ) {}

  ngOnInit() {
    this.verificarAcceso();
  }

  verificarAcceso() {
    const user = this.authService.currentUserValue;
    if (!user) {
      this.error = "Usuario no autenticado.";
      return;
    }

    // Guardar el rol actual para uso posterior
    this.currentUserRol = user.rolId;

    // Verificar los roles permitidos
    const rolesPermitidos = [
      RolType.Vendor,           // Vendor
      RolType.Administrador,    // Admin
      RolType.OficialComercial, // Oficial Comercial
      RolType.AdminCanal        // Admin Canal
    ];

    if (!rolesPermitidos.includes(user.rolId)) {
      this.error = "No tienes permisos para acceder al cotizador.";
      return;
    }

    // Si no es vendor, necesitará seleccionar un vendor
    if (user.rolId !== RolType.Vendor) {
      this.necesitaSeleccionarVendor = true;
      this.cargarVendors();
    } else {
      // Si es vendor, ya tenemos su ID
      this.vendorSeleccionado = user.id;
      this.wizardData.vendorId = user.id;
      this.cargarSubcanalesVendor(user.id);
    }
  }



  toggleSidebar(): void {
    // En móvil, siempre expandimos
    this.sidebarStateService.setCollapsed(false);

    // Añadir clase al body para móvil
    if (window.innerWidth < 992) {
      document.body.classList.add('sidebar-open');

      // Manipulación directa del sidebar para asegurarnos que se muestre
      const sidebar = document.querySelector('.sidebar') as HTMLElement;
      if (sidebar) {
        sidebar.style.transform = 'translateX(0)';
      }
    }
  }

  cargarVendors() {
    this.cargando = true;

    this.usuarioService.getUsuariosPorRol(RolType.Vendor).subscribe({
      next: (usuarios) => {
        this.vendors = usuarios.filter(u => u.activo);
        this.cargando = false;

        if (this.vendors.length === 0) {
          this.error = "No hay vendedores activos disponibles.";
        }
      },
      error: (error) => {
        this.error = "Error al cargar la lista de vendedores.";
        this.cargando = false;
      }
    });
  }

  verificarEstadoCanales(subcanales: Subcanal[]) {
    if (subcanales.length === 0) {
      this.error = "No hay subcanales disponibles.";
      return;
    }

    if (this.currentUserRol === RolType.Vendor || this.currentUserRol === RolType.AdminCanal) {
      const subcanalesActivos = subcanales.filter(s => s.activo);

      if (subcanalesActivos.length === 0) {
        this.error = "No hay subcanales activos disponibles.";
        return;
      }

      if (subcanalesActivos.length === 1) {
        this.subcanalSeleccionado = subcanalesActivos[0].id;
        this.necesitaSeleccionarSubcanal = false;
      } else {
        this.necesitaSeleccionarSubcanal = true;
      }

      this.convertirADatosWizard(subcanalesActivos);
      return;
    }

    const canalIds = [...new Set(subcanales.map(s => s.canalId))];
    const canalesObservables = canalIds.map(canalId =>
      this.canalService.getCanal(canalId).pipe(
        catchError(err => of(null))
      )
    );

    forkJoin(canalesObservables).subscribe({
      next: (canales) => {
        const canalesActivos = canales.filter(canal => canal && canal.activo);

        if (canalesActivos.length === 0) {
          this.error = "No hay canales activos disponibles. No se pueden realizar operaciones.";
          return;
        }

        if (subcanales.length === 1) {
          const subcanalUnico = subcanales[0];
          const canalDelSubcanal = canales.find(c => c && c.id === subcanalUnico.canalId);

          if (!canalDelSubcanal || !canalDelSubcanal.activo) {
            this.error = "El canal asociado a su subcanal no está activo. No se pueden realizar operaciones.";
            return;
          }

          this.subcanalSeleccionado = subcanalUnico.id;
          this.necesitaSeleccionarSubcanal = false;
        } else {
          const subcanalesConCanalActivo = subcanales.filter(subcanal => {
            const canalActivo = canales.find(c => c && c.id === subcanal.canalId && c.activo);
            return !!canalActivo;
          });

          if (subcanalesConCanalActivo.length === 0) {
            this.error = "No hay subcanales con canales activos disponibles.";
            return;
          }

          if (subcanalesConCanalActivo.length === 1) {
            this.subcanalSeleccionado = subcanalesConCanalActivo[0].id;
            this.necesitaSeleccionarSubcanal = false;
          } else {
            this.necesitaSeleccionarSubcanal = true;
          }
        }

        this.convertirADatosWizard(this.necesitaSeleccionarSubcanal ? subcanales : [subcanales.find(s => s.id === this.subcanalSeleccionado)!]);
      },
      error: (error) => {
        this.error = "Error al verificar el estado de los canales.";
      }
    });
  }

  seleccionarVendor(vendorId: number) {
    this.vendorSeleccionado = vendorId;
    this.wizardData.vendorId = vendorId;
    this.necesitaSeleccionarVendor = false;
    this.cargarSubcanalesVendor(vendorId);
  }

  cargarSubcanalesVendor(vendorId: number) {
    this.cargando = true;
    this.error = null;

    // Primero verificamos si el vendor está activo (aunque debería estarlo)
    this.usuarioService.getUsuario(vendorId).pipe(
      switchMap(usuario => {
        if (!usuario.activo) {
          return of({ error: "El vendedor no está activo." });
        }

        // Si el vendor está activo, cargamos sus subcanales
        return this.subcanalService.getSubcanalesPorUsuario(vendorId).pipe(
          map(subcanales => ({ subcanales }))
        );
      }),
      catchError(error => {
        return of({ error: "Error al cargar información del vendedor." });
      }),
      finalize(() => this.cargando = false)
    ).subscribe(result => {
      if ('error' in result) {
        this.error = result.error as string;
        return;
      }

      const subcanales = result.subcanales as Subcanal[];

      // Filtramos solo los subcanales activos
      const subcanalesActivos = subcanales.filter(s => s.activo);

      if (subcanalesActivos.length === 0) {
        this.error = "El vendedor no tiene subcanales activos asignados.";
        return;
      }

      this.subcanales = subcanalesActivos;

      // Verificar el estado de los canales correspondientes
      this.verificarEstadoCanales(subcanalesActivos);
    });
  }

  // Add a new method to improve the flow
  convertirADatosWizard(subcanales: Subcanal[]) {
    this.cargando = true;

    // Procesar cada subcanal para obtener los planes de su canal
    const subcanalInfos: SubcanalInfo[] = [];

    let procesados = 0;
    const total = subcanales.length;

    if (total === 0) {
      this.datosWizard = { subcanales: [] };
      this.cargando = false;
      return;
    }

    // Simplificamos para el caso Admin/OficialComercial/AdminCanal
    // Usamos getPlanesActivos en lugar de consultar cada canal
    this.planService.getPlanesActivos().subscribe({
      next: (planes) => {
        if (!planes || planes.length === 0) {
          this.error = "No se encontraron planes activos disponibles.";
          this.cargando = false;
          return;
        }

        // Crear SubcanalInfo para cada subcanal usando los planes activos
        subcanales.forEach(subcanal => {
          const planesDisponibles = planes.map(plan => ({
            id: plan.id,
            nombre: plan.nombre,
            tasa: plan.tasa,
            montoMinimo: plan.montoMinimo,
            montoMaximo: plan.montoMaximo,
            cuotasAplicables: plan.cuotasAplicablesList || this.obtenerCuotasAplicables(plan.cuotasAplicables)
          }));

          subcanalInfos.push({
            subcanalId: subcanal.id,
            subcanalNombre: subcanal.nombre,
            subcanalActivo: subcanal.activo,
            subcanalComision: subcanal.comision,
            canalId: subcanal.canalId,
            gastos: subcanal.gastos || [],
            planesDisponibles: planesDisponibles
          });
        });

        // Configurar el wizard con los datos
        this.datosWizard = { subcanales: subcanalInfos };

        // Determinar si necesita seleccionar subcanal o ir directo a paso 1
        if (subcanalInfos.length > 1) {
          this.necesitaSeleccionarSubcanal = true;
        } else if (subcanalInfos.length === 1) {
          this.seleccionarSubcanalPorId(subcanalInfos[0].subcanalId);
          this.necesitaSeleccionarSubcanal = false;
        }

        this.cargando = false;
      },
      error: (error) => {
        this.error = "Error al obtener planes disponibles.";
        this.cargando = false;
      }
    });
  }



  cargarPlanesParaSubcanales(subcanales: Subcanal[]) {
    let procesados = 0;
    const total = subcanales.length;
    const subcanalInfos: SubcanalInfo[] = [];
    this.cargando = true;

    // Case for AdminCanal (unchanged)
    if (this.currentUserRol === RolType.AdminCanal) {
      // Existing AdminCanal code...
      // ...
    }
    // Special case for Vendor role - they don't have permission to get canal details
    else if (this.currentUserRol === RolType.Vendor) {

      // Process each subcanal
      subcanales.forEach(subcanal => {
        // For vendors, we'll get available plans directly
        this.planService.getPlanesActivos().subscribe({
          next: (planes) => {
            if (!planes || planes.length === 0) {
              procesados++;
              if (procesados === total) {
                this.finalizarCargaDeSubcanales(subcanalInfos);
              }
              return;
            }

            // Convert the plans to the expected format
            const planesDisponibles = planes.map(plan => ({
              id: plan.id,
              nombre: plan.nombre,
              tasa: plan.tasa,
              montoMinimo: plan.montoMinimo,
              montoMaximo: plan.montoMaximo,
              cuotasAplicables: plan.cuotasAplicablesList || this.obtenerCuotasAplicables(plan.cuotasAplicables)
            }));

            // Create subcanalInfo
            subcanalInfos.push({
              subcanalId: subcanal.id,
              subcanalNombre: subcanal.nombre,
              subcanalActivo: subcanal.activo,
              subcanalComision: subcanal.comision,
              canalId: subcanal.canalId,
              gastos: subcanal.gastos || [],
              planesDisponibles: planesDisponibles
            });

            procesados++;
            if (procesados === total) {
              this.finalizarCargaDeSubcanales(subcanalInfos);
            }
          },
          error: (error) => {
            procesados++;
            if (procesados === total) {
              this.finalizarCargaDeSubcanales(subcanalInfos);
            }
          }
        });
      });
    }
    // Other roles (Admin, OficialComercial)
    else {
      // Existing code for other roles...
      // ...
    }

    // Add a timeout to prevent infinite loading
    setTimeout(() => {
      if (this.cargando) {
        this.cargando = false;
        this.error = "La carga de datos tomó demasiado tiempo. Por favor, intente nuevamente.";
      }
    }, 15000); // 15 segundos de timeout
  }
  finalizarCargaDeSubcanales(subcanalInfos: SubcanalInfo[]) {
    if (subcanalInfos.length === 0) {
      this.error = "No se encontraron subcanales con planes disponibles.";
      this.cargando = false;
      return;
    }

    this.datosWizard = { subcanales: subcanalInfos };

    if (subcanalInfos.length > 1) {
      this.necesitaSeleccionarSubcanal = true;
    } else {
      this.seleccionarSubcanalPorId(subcanalInfos[0].subcanalId);
      this.necesitaSeleccionarSubcanal = false;
    }

    this.cargando = false;
  }



  obtenerCuotasAplicables(cuotasStr: string): number[] {
    if (!cuotasStr) return [];
    try {
      // Intentamos parsear directamente si ya es un array
      if (Array.isArray(cuotasStr)) {
        return cuotasStr;
      }
      // Si es string, convertimos a array de números
      return cuotasStr.split(',').map(c => parseInt(c.trim(), 10));
    } catch (e) {
      return [];
    }
  }

  volverAlSeleccionVendor() {
    this.necesitaSeleccionarVendor = true;
    this.necesitaSeleccionarSubcanal = false;
    this.subcanalSeleccionado = null;
    this.subcanalSeleccionadoInfo = null;
    this.vendorSeleccionado = null;
    this.wizardData = { paso: 1 };
    this.dataService.reiniciarDatos();
  }



  continuarPaso1(datos: {monto: number, plazo: number}) {
    this.wizardData.monto = datos.monto;
    this.wizardData.plazo = datos.plazo;
    this.wizardData.paso = 2;

    // Asegurarse de mantener el vendorId
    if (this.vendorSeleccionado) {
      this.wizardData.vendorId = this.vendorSeleccionado;
    }


    // Guardar en el data service con el vendorId
    this.dataService.guardarDatosPaso1({
      monto: datos.monto,
      plazo: datos.plazo,
      planTipo: this.dataService.planTipo,
      valorCuota: this.dataService.valorCuota,
      planId: this.dataService.planId,
      vendorId: this.wizardData.vendorId
    });

    // Crear un nuevo objeto para asegurar detección de cambios
    this.wizardData = { ...this.wizardData };

    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  continuarPaso2(datos: any) {
    this.cargando = true;
    this.error = null;

    // 🧠 Deducir sexo si no vino explícito y hay CUIT
    let sexo = datos.sexo;
    if (!sexo && datos.cuil) {
      const cuilStr = datos.cuil.toString();
      const prefijo = parseInt(cuilStr.substring(0, 2), 10);
      if (prefijo === 27) sexo = 'F';
      else if ([20, 23, 24].includes(prefijo)) sexo = 'M';
    }

    // 🧮 Calcular CUIL si no vino y tenemos DNI + sexo
    let cuilParaBcra = datos.cuil;
    if (!cuilParaBcra && datos.dni && sexo) {
      cuilParaBcra = this.calcularCuil(datos.dni, sexo);
      datos.cuil = cuilParaBcra; // también lo guardamos
    }

    // Guardar datos del cliente en wizard
    this.wizardData = {
      ...this.wizardData,
      clienteId: datos.clienteId,
      clienteNombre: datos.nombre,
      clienteApellido: datos.apellido,
      clienteWhatsapp: datos.whatsapp,
      clienteEmail: datos.email,
      clienteDni: datos.dni || "",
      clienteCuil: datos.cuil || "",
      clienteSexo: sexo || "",
      ingresos: datos.ingresos,
      auto: datos.auto || "",
      codigoPostal: datos.codigoPostal,
      estadoCivil: datos.estadoCivil || ""
    };

    // Guardar en servicio compartido
    this.dataService.guardarDatosPaso2({
      nombre: datos.nombre,
      apellido: datos.apellido,
      whatsapp: datos.whatsapp,
      email: datos.email,
      dni: datos.dni || undefined,
      cuil: datos.cuil || undefined,
      sexo: sexo || undefined,
      clienteId: datos.clienteId,
      ingresos: datos.ingresos,
      auto: datos.auto,
      codigoPostal: datos.codigoPostal,
      estadoCivil: datos.estadoCivil
    });

    // 🚨 Consultar situación BCRA si tenemos CUIL
    if (cuilParaBcra) {
      this.BcraService.consultarSituacion(cuilParaBcra).then(situacion => {

        const situacionReal = situacion ?? 0;
        this.dataService.situacionBcra = situacionReal;
        this.dataService.rechazadoPorBcra = situacionReal === 0 || [4, 5].includes(situacionReal);

    this.crearCliente(datos);
      }).catch((error: any) => {
        this.error = "Error al verificar situación crediticia. Intente nuevamente.";
        this.cargando = false;
      });
    } else {
      this.error = "Falta información para consultar la situación crediticia.";
      this.cargando = false;
    }
  }

  private calcularCuil(dni: string | number, sexo: 'M' | 'F'): string {
    const dniStr = dni.toString().padStart(8, '0');
    const prefijo = sexo === 'F' ? '27' : '20';

    const base = `${prefijo}${dniStr}`;
    const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;

    for (let i = 0; i < coeficientes.length; i++) {
      suma += parseInt(base[i]) * coeficientes[i];
    }

    let resto = suma % 11;
    let verificador;

    if (resto === 0) verificador = 0;
    else if (resto === 1) verificador = 9;
    else verificador = 11 - resto;

    return `${prefijo}${dniStr}${verificador}`;
  }



  // Método para actualizar una operación existente
  private actualizarOperacion(clienteId: number) {
    if (!this.wizardData.operacionId || !this.wizardData.monto || !this.wizardData.plazo) {

      this.obtenerPlanesYAvanzar();
      return;
    }

    // Buscar el plan a utilizar en función de monto y plazo
    if (!this.subcanalSeleccionadoInfo || !this.subcanalSeleccionadoInfo.planesDisponibles) {
      this.obtenerPlanesYAvanzar();
      return;
    }

    // Encontrar un plan adecuado
    const planesAplicables = this.subcanalSeleccionadoInfo.planesDisponibles.filter(plan =>
      this.wizardData.monto! >= plan.montoMinimo &&
      this.wizardData.monto! <= plan.montoMaximo &&
      plan.cuotasAplicables.includes(this.wizardData.plazo!)
    );

    if (planesAplicables.length === 0) {
      this.obtenerPlanesYAvanzar();
      return;
    }

    // Usar el primer plan aplicable
    const planId = planesAplicables[0].id;
    const tasa = planesAplicables[0].tasa;

    // Crear objeto para actualizar
    const operacion: Operacion = {
      monto: this.wizardData.monto!,
      meses: this.wizardData.plazo!,
      tasa: tasa,
      clienteId: this.wizardData.clienteId ?? 0, // O usa otro valor predeterminado apropiado
      planId: planId,
      subcanalId: this.subcanalSeleccionado!,
      canalId: this.subcanalSeleccionadoInfo?.canalId || 0,
      vendedorId: this.vendorSeleccionado ?? undefined, // Convierte null a undefined
    };


    // Como probablemente no existe un método actualizar, simplemente continuamos
    this.obtenerPlanesYAvanzar();
  }




  private crearCliente(datos: any) {
    // Si no vino CUIL pero sí DNI y sexo, lo calculamos
    if (!datos.cuil && datos.dni && datos.sexo) {
      datos.cuil = this.calcularCuil(datos.dni, datos.sexo);
    }

    const clienteData: ClienteCrearDto = {
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.whatsapp,
      email: datos.email,
      dni: datos.dni || undefined,
      cuil: datos.cuil || undefined,
      sexo: this.wizardData.clienteSexo || undefined,
      canalId: this.subcanalSeleccionadoInfo?.canalId,
      ingresos: datos.ingresos,
      auto: datos.auto,
      codigoPostal: datos.codigoPostal,
      estadoCivil: datos.estadoCivil,
      autoasignarVendor: true
    };

    this.clienteService.crearCliente(clienteData).subscribe({
      next: (cliente: Cliente) => {
        if (cliente && typeof cliente.id === 'number') {
          this.wizardData.clienteId = cliente.id;
          this.dataService.clienteId = cliente.id;
          this.asignarVendorACliente(cliente.id);
        } else {
          this.obtenerPlanesYAvanzar();
        }
      },
      error: () => {
        this.obtenerPlanesYAvanzar();
      }
    });
  }





  // Método para asignar vendor a cliente
  private asignarVendorACliente(clienteId: number) {
    if (typeof clienteId !== 'number' || isNaN(clienteId) || clienteId <= 0) {
      this.obtenerPlanesYAvanzar();
      return;
    }

    // Usar el vendedor seleccionado en lugar del usuario actual
    const vendorId = this.vendorSeleccionado;

    if (!vendorId) {
      this.obtenerPlanesYAvanzar();
      return;
    }


    this.clienteVendorService.asignarVendorACliente(clienteId, vendorId).subscribe({
      next: (resultado) => {
        this.obtenerPlanesYAvanzar();
      },
      error: (error) => {
        this.obtenerPlanesYAvanzar();
      }
    });
  }

  private obtenerPlanesYAvanzar() {
    if (!this.subcanalSeleccionado || !this.wizardData.monto || !this.wizardData.plazo) {
      this.error = "Faltan datos para calcular planes disponibles.";
      this.cargando = false;
      return;
    }

    if (this.yaCreoLeadEnKommo) {
      this.cargando = false;
      return;
    }

    if (this.subcanalSeleccionadoInfo && this.subcanalSeleccionadoInfo.planesDisponibles) {
      const planesAplicables = this.subcanalSeleccionadoInfo.planesDisponibles.filter(plan =>
        this.wizardData.monto! >= plan.montoMinimo &&
        this.wizardData.monto! <= plan.montoMaximo &&
        plan.cuotasAplicables.includes(this.wizardData.plazo!)
      );

      if (planesAplicables.length === 0) {
        this.error = "No hay planes disponibles para el monto y plazo seleccionados.";
        this.cargando = false;
        return;
      }

      const planesConCuotas = planesAplicables.map(plan => {
        const comisionSubcanal = this.subcanalSeleccionadoInfo?.subcanalComision || 0;
        let cuota = this.cotizadorService.calcularCuota(
          this.wizardData.monto!,
          this.wizardData.plazo!,
          plan.tasa,
          this.gastosSeleccionados
        );
        if (comisionSubcanal > 0) {
          cuota = Math.round(cuota * (1 + comisionSubcanal / 100));
        }
        return {
          ...plan,
          cuota: cuota
        };
      });

      this.wizardData.planesDisponibles = planesConCuotas;
      const planSeleccionado = planesConCuotas[0];

      this.crearOperacion(planSeleccionado.id, planSeleccionado.tasa).then(() => {
        this.wizardData.paso = 3;
        this.cargando = false;
      }).catch(error => {
        this.error = "Hubo un problema al crear la operación. Por favor, intenta nuevamente.";
        this.cargando = false;
      });
    } else {
      this.error = "No se encontraron planes disponibles para el subcanal seleccionado.";
      this.cargando = false;
    }
  }

  seleccionarSubcanal(subcanalId: number) {
    // Verificar que el subcanal esté activo
    const subcanalInfo = this.datosWizard?.subcanales?.find(s => s.subcanalId === subcanalId);

    if (!subcanalInfo) {
      this.error = "No se encontró información del subcanal seleccionado.";
      return;
    }

    if (!subcanalInfo.subcanalActivo) {
      this.error = "El subcanal seleccionado no está activo.";
      return;
    }

    this.seleccionarSubcanalPorId(subcanalId);
    this.necesitaSeleccionarSubcanal = false;
  }
  seleccionarSubcanalPorId(subcanalId: number) {
    if (!this.datosWizard || !this.datosWizard.subcanales) {
      return;
    }

    // Buscar el subcanal completo por su ID
    const subcanalInfo = this.datosWizard.subcanales.find(
      subcanal => subcanal.subcanalId === subcanalId
    );

    if (subcanalInfo) {
      this.subcanalSeleccionado = subcanalId;
      this.subcanalSeleccionadoInfo = subcanalInfo;
      this.gastosSeleccionados = subcanalInfo.gastos || [];

      // Guardar la información en el dataService para que esté disponible en step3
      this.dataService.guardarSubcanalInfo(subcanalInfo);
    } else {
    }
  }

  seleccionarPlan(planId: number) {
    this.cargando = true;

    if (!this.subcanalSeleccionado || !this.wizardData.monto || !this.wizardData.plazo) {
      this.error = "Faltan datos para completar la operación.";
      this.cargando = false;
      return;
    }

    // Buscar el plan seleccionado para obtener la tasa
    const planSeleccionado = this.wizardData.planesDisponibles?.find(plan => plan.id === planId);

    if (!planSeleccionado) {
      this.error = "No se encontró el plan seleccionado.";
      this.cargando = false;
      return;
    }

    // Enviamos el WhatsApp directamente (la operación ya fue creada en el paso anterior)
    this.enviarOfertaPorWhatsApp(planSeleccionado);
    this.cargando = false;
  }


  private crearOperacion(planId: number, tasa: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.wizardData.operacionId) {
        resolve({ id: this.wizardData.operacionId });
        return;
      }

      const usuarioCreadorId = this.authService.currentUserValue?.id || 0;
      const estadoOperacion = this.dataService.rechazadoPorBcra ? 'RECHAZADO' : 'APTO CREDITO';

      const operacionData = {
        monto: this.wizardData.monto!,
        meses: this.wizardData.plazo!,
        tasa: tasa,
        planId: planId,
        subcanalId: this.subcanalSeleccionado!,
        canalId: this.subcanalSeleccionadoInfo?.canalId || 0,
        vendedorId: this.vendorSeleccionado ?? 0,
        usuarioCreadorId: usuarioCreadorId,
        estado: estadoOperacion
      };

      const ejecutarKommoSiNoFue = (op: any, cliente: any) => {
        if (!this.yaCreoLeadEnKommo) {
          this.yaCreoLeadEnKommo = true;
          this.crearLeadEnKommo(op, cliente);
        }
      };

      // FLUJO 1 - Crear cliente + operación juntos
      if (!this.wizardData.clienteId) {
        const clienteData = {
          nombre: this.wizardData.clienteNombre || "",
          apellido: this.wizardData.clienteApellido || "",
          whatsapp: this.wizardData.clienteWhatsapp || "",
          telefono: this.wizardData.clienteWhatsapp || "",
          email: this.wizardData.clienteEmail || "",
          dni: this.wizardData.clienteDni || "",
          cuil: this.wizardData.clienteCuil || "",
          sexo: this.wizardData.clienteSexo || "",
          provincia: "",
          estadoCivil: this.wizardData.estadoCivil || ""
        };

        this.operacionService.crearClienteYOperacion(clienteData, operacionData).subscribe({
          next: (opCreada) => {
            if (opCreada?.id) {
              this.wizardData.operacionId = opCreada.id;
              ejecutarKommoSiNoFue(opCreada, clienteData);
            }
            resolve(opCreada);
          },
          error: (err) => {
            resolve({ dummy: true });
          }
        });
      }
      // FLUJO 2 - Cliente ya existe
      else {
        this.clienteService.getClienteById(this.wizardData.clienteId).subscribe({
          next: (cliente) => {
            const operacion: Operacion = {
              ...operacionData,
              clienteId: cliente.id,
            };

            this.operacionService.crearOperacion(operacion).subscribe({
              next: (opCreada) => {
                if (opCreada?.id) {
                  this.wizardData.operacionId = opCreada.id;
                  ejecutarKommoSiNoFue(opCreada, cliente);
                }
                resolve(opCreada);
              },
              error: (err) => {
                resolve({ dummy: true });
              }
            });
          },
          error: (err) => {
            resolve({ dummy: true });
          }
        });
      }
    });
  }



  private crearLeadEnKommo(operacionCreada: any, cliente: any): void {
    if (!this.KommoService.isAuthenticated()) return;
    if (!operacionCreada || !cliente) return;

    const nombre = (cliente?.nombre || this.wizardData.clienteNombre || '').toString();
    const apellido = (cliente?.apellido || this.wizardData.clienteApellido || '').toString();
    const telefono = cliente.telefono || this.wizardData.clienteWhatsapp || '+5491100000000';
    const email = cliente.email || this.wizardData.clienteEmail || 'sin-email@mundo.com';
    const codigoPostal = cliente.codigoPostal?.toString() || this.wizardData.codigoPostal?.toString() || '';
    const estadoCivil = cliente.estadoCivil || this.wizardData.estadoCivil || '';
    const ingresos = cliente.ingresos || this.wizardData.ingresos || 0;
    const cuitODni = cliente.cuil || this.wizardData.clienteDni || '';
    const sexo = cliente.sexo || this.wizardData.clienteSexo || '';
    const auto = (cliente.auto || this.wizardData.auto || '').toString();

    // Obtener el ID del plan seleccionado
    const planId = this.dataService.planId;

    // Variable para almacenar el nombre real del plan
    let nombreRealPlan = '';

    // Intentar obtener el nombre real del plan desde los planes disponibles en el subcanal
    if (this.subcanalSeleccionadoInfo && this.subcanalSeleccionadoInfo.planesDisponibles) {
      const planEncontrado = this.subcanalSeleccionadoInfo.planesDisponibles.find(plan => plan.id === planId);
      if (planEncontrado) {
        nombreRealPlan = planEncontrado.nombre;
        console.log('Kommo - Nombre real del plan encontrado:', nombreRealPlan);
      }
    }

    // Si no se encuentra, buscar el plan a través del servicio
    if (!nombreRealPlan) {
      // Primero intentamos buscar en el planService
      this.planService.getPlan(planId).subscribe({
        next: (plan) => {
          if (plan && plan.nombre) {
            nombreRealPlan = plan.nombre;
            console.log('Kommo - Nombre real del plan obtenido del servicio:', nombreRealPlan);
          } else {
            // Si no se encuentra, usamos el nombre del tipo seleccionado como fallback
            nombreRealPlan = this.dataService.planTipo || 'UVA';
            console.log('Kommo - Usando nombre del tipo como fallback:', nombreRealPlan);
          }

          // Continuamos con el proceso después de obtener el nombre del plan
          this.continuarCreacionLead(operacionCreada, cliente, nombreRealPlan);
        },
        error: (error) => {
          console.error('Error al obtener plan:', error);
          // Si hay error, usamos el nombre del tipo seleccionado como fallback
          nombreRealPlan = this.dataService.planTipo || 'UVA';
          console.log('Kommo - Usando nombre del tipo como fallback por error:', nombreRealPlan);

          // Continuamos con el proceso después de obtener el nombre del plan
          this.continuarCreacionLead(operacionCreada, cliente, nombreRealPlan);
        }
      });
    } else {
      // Si ya encontramos el nombre del plan, continuamos con el proceso
      this.continuarCreacionLead(operacionCreada, cliente, nombreRealPlan);
    }
  }

  // Método auxiliar para continuar con la creación del lead después de obtener el nombre del plan
  private continuarCreacionLead(operacionCreada: any, cliente: any, nombrePlan: string): void {
    const nombre = (cliente?.nombre || this.wizardData.clienteNombre || '').toString();
    const apellido = (cliente?.apellido || this.wizardData.clienteApellido || '').toString();
    const telefono = cliente.telefono || this.wizardData.clienteWhatsapp || '+5491100000000';
    const email = cliente.email || this.wizardData.clienteEmail || 'sin-email@mundo.com';
    const codigoPostal = cliente.codigoPostal?.toString() || this.wizardData.codigoPostal?.toString() || '';
    const estadoCivil = cliente.estadoCivil || this.wizardData.estadoCivil || '';
    const ingresos = cliente.ingresos || this.wizardData.ingresos || 0;
    const cuitODni = cliente.cuil || this.wizardData.clienteDni || '';
    const sexo = cliente.sexo || this.wizardData.clienteSexo || '';
    const auto = (cliente.auto || this.wizardData.auto || '').toString();

    let sexoFieldValue: number | undefined;
    if (sexo.toUpperCase() === 'F') sexoFieldValue = 542410;
    if (sexo.toUpperCase() === 'M') sexoFieldValue = 542412;

    this.obtenerDatosComplementarios(operacionCreada).then(async operacionCompleta => {
      try {
        // Obtener datos del vendedor
        const vendedor = await firstValueFrom(this.usuarioService.getUsuario(operacionCompleta.vendedorId));
        const nombreLimpio = (nombre || '').toString().trim();
        const apellidoLimpio = (apellido || '').toString().trim();
        const nombreLead = `#${operacionCompleta.id || 'Nuevo'} - ${nombreLimpio} ${apellidoLimpio}`.trim();

        // Crear contacto
        const contactoRes: any = await firstValueFrom(this.KommoService.crearContacto([{
          first_name: nombre,
          last_name: apellido,

          custom_fields_values: [
            { field_id: 500552, values: [{ value: telefono }] }, // Teléfono
            { field_id: 500554, values: [{ value: email }] },    // Email
            { field_id: 650694, values: [{ value: codigoPostal }] }, // CP
            { field_id: 964686, values: [{ value: estadoCivil }] },  // Estado civil
            { field_id: 964710, values: [{ value: ingresos }] },     // Ingresos
            { field_id: 964712, values: [{ value: parseInt(cuitODni.toString(), 10) }] }, // CUIT
            { field_id: 965120, values: [{ value: parseInt(cliente.dni || this.wizardData.clienteDni || '', 10) }] }, // DNI
            { field_id: 965118, values: [{ value: this.dataService.situacionBcra ?? 0 }] }, // Situación BCRA
            ...(sexoFieldValue ? [{ field_id: 650450, values: [{ enum_id: sexoFieldValue }] }] : [])
          ]
        }]));

        const contactId = contactoRes._embedded?.contacts?.[0]?.id;
        if (!contactId) throw new Error('No se pudo obtener el ID del contacto');

        // Crear compañía
        const companiaRes: any = await firstValueFrom(this.KommoService.crearCompania([{
          name: operacionCompleta.canalNombre || 'Canal', // Usar el nombre del canal en lugar del nombreLead
          custom_fields_values: [
            { field_id: 500552, values: [{ value: vendedor.telefono || '+5491100000000' }] },
            { field_id: 962818, values: [{ value: `${vendedor.nombre} ${vendedor.apellido}` }] },
            { field_id: 963284, values: [{ value: operacionCompleta.subcanalNombre || 'Subcanal' }] }
          ]
        }]));

        const companyId = companiaRes._embedded?.companies?.[0]?.id;
        if (!companyId) throw new Error('No se pudo obtener el ID de la compañía');

        const etiquetas = this.dataService.rechazadoPorBcra
          ? [{ name: 'Rechazado BCRA', id: 54266 }]
          : [{ name: 'Enviar a Banco', id: 35522 }];

        // Crear lead final con todo - usando nombrePlan real obtenido
        const lead = [{
          name: `#${operacionCompleta.id || 'Nuevo'} - ${nombre} ${apellido}`,
          custom_fields_values: [
            { field_id: 500886, values: [{ value: operacionCompleta.id?.toString() || '' }] },
            { field_id: 500892, values: [{ value: parseFloat(operacionCompleta.monto) || 0 }] },
            { field_id: 964680, values: [{ value: parseInt(operacionCompleta.meses) || 0 }] },
            { field_id: 500996, values: [{ value: parseFloat(operacionCompleta.tasa) || 0 }] },
            { field_id: 965126, values: [{ value: auto }] }, // auto como texto

            // Usar el nombre real del plan obtenido
            { field_id: 962344, values: [{ value: nombrePlan }] }
          ],
          _embedded: {
            contacts: [{ id: contactId }],
            companies: [{ id: companyId }],
            tags: etiquetas
          }
        }];

        console.log('🚀 Payload FINAL a enviar a Kommo:', JSON.stringify(lead, null, 2));

        this.kommoLeadService.crearLeadComplejo(lead).subscribe();
      } catch (error) {
        console.error('❌ Error en crearLeadEnKommo:', error);
      }
    });
  }












  // Método para obtener datos complementarios para Kommo
private async obtenerDatosComplementarios(operacion: any): Promise<any> {
  // Crear copia de la operación para no modificar el original
  const operacionCompleta = { ...operacion };

  try {
    // 1. Si la operación ya tiene planNombre, usarlo; de lo contrario, intentar obtenerlo
    if (!operacionCompleta.planNombre && operacionCompleta.planId) {
      try {
        const plan = await firstValueFrom(this.planService.getPlan(operacionCompleta.planId));
        if (plan) {
          operacionCompleta.planNombre = plan.nombre;
        }
      } catch (err) {
      }
    }

    // 2. Igual para subcanalNombre
    if (!operacionCompleta.subcanalNombre && operacionCompleta.subcanalId) {
      try {
        const subcanal = await firstValueFrom(this.subcanalService.getSubcanal(operacionCompleta.subcanalId));
        if (subcanal) {
          operacionCompleta.subcanalNombre = subcanal.nombre;

          // 3. Y para canalNombre usando el canalId del subcanal
          if (!operacionCompleta.canalNombre && subcanal.canalId) {
            try {
              const canal = await firstValueFrom(this.canalService.getCanal(subcanal.canalId));
              if (canal) {
                operacionCompleta.canalNombre = canal.nombreFantasia;
              }
            } catch (err) {
            }
          }
        }
      } catch (err) {
      }
    }

    // 4. Y para vendedorNombre
    if (!operacionCompleta.vendedorNombre && operacionCompleta.vendedorId) {
      try {
        const vendedor = await firstValueFrom(this.usuarioService.getUsuario(operacionCompleta.vendedorId));
        if (vendedor) {
          operacionCompleta.vendedorNombre = `${vendedor.nombre} ${vendedor.apellido}`;
          operacionCompleta.vendedorTelefono = vendedor.telefono || '';
          operacionCompleta.vendedorEmail = vendedor.email || '';
        }
      } catch (err) {
      }
    }

    return operacionCompleta;
  } catch (error) {
    return operacion; // Devolver la operación original en caso de error
  }
}
  enviarOfertaPorWhatsApp(plan: any) {
    if (!this.wizardData.clienteWhatsapp) {
      return;
    }

    const telefono = this.wizardData.clienteWhatsapp.replace(/\D/g, '');
    const nombre = this.wizardData.clienteNombre || "cliente";
    const monto = this.wizardData.monto?.toLocaleString('es-AR') || "0";
    const cuotas = this.wizardData.plazo || "0";
    const valorCuota = plan.cuota.toLocaleString('es-AR');

    // Construir el mensaje
    const mensaje = encodeURIComponent(
      `¡Hola ${nombre}! Te enviamos el detalle de tu oferta de Mundo Prendario:\n\n` +
      `Monto: $${monto}\n` +
      `Cuotas: ${cuotas}\n` +
      `Valor de cuota: $${valorCuota}\n\n` +
      `¿Te gustaría continuar con el proceso?`
    );

    // Abrir WhatsApp en una nueva pestaña
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  }

  volverAlPasoAnterior() {
    if (this.wizardData.paso > 1) {
      const pasoAnterior = this.wizardData.paso - 1;

      // Si vamos del paso 3 al paso 2, necesitamos asegurarnos de que
      // los datos del cliente estén disponibles para cargar en el formulario
      if (this.wizardData.paso === 3 && pasoAnterior === 2) {
        // Guardamos el ID de operación actual para poder actualizarlo en lugar de crear uno nuevo
        const operacionId = this.wizardData.operacionId;

        this.wizardData.paso = pasoAnterior;
      } else {
        // Para otros pasos, simplemente retrocedemos
        this.wizardData.paso = pasoAnterior;
      }
    }
  }

  volverAlSeleccionSubcanal() {
    // Reiniciar la selección de subcanal
    this.wizardData.paso = 1;
    this.necesitaSeleccionarSubcanal = true;
    this.subcanalSeleccionado = null;
    this.subcanalSeleccionadoInfo = null;
  }
  reiniciarWizard() {
    this.error = null;
    window.location.href = '/home'; // Redirigir a home
  }
}
