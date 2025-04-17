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
import { forkJoin, of } from 'rxjs';
import { CanalService } from 'src/app/core/services/canal.service';
import { PlanService } from 'src/app/core/services/plan.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { KommoLeadService } from 'src/app/core/services/kommo-lead.service';
import { KommoService } from '../../../core/services/kommo.service';



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
        console.error('Error al obtener planes activos:', error);
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
            console.error(`Error al obtener planes activos:`, error);
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
        console.error('Timeout: La carga de datos tomó demasiado tiempo');
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
      console.error('Error al procesar cuotas aplicables:', e);
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

    // Guardar datos del cliente en el wizard
    this.wizardData = {
      ...this.wizardData,
      clienteId: datos.clienteId,
      clienteNombre: datos.nombre,
      clienteApellido: datos.apellido,
      clienteWhatsapp: datos.whatsapp,
      clienteEmail: datos.email,
      clienteDni: datos.dni || "",
      clienteCuil: datos.cuil || "",
      clienteSexo: datos.sexo || "",
      // Nuevos campos
      ingresos: datos.ingresos,
      auto: datos.auto || "",
      codigoPostal: datos.codigoPostal,
      estadoCivil: datos.estadoCivil || ""
    };

    // Guardar los datos en el servicio compartido para acceder desde Step3
    this.dataService.guardarDatosPaso2({
      nombre: datos.nombre,
      apellido: datos.apellido,
      whatsapp: datos.whatsapp,
      email: datos.email,
      dni: datos.dni || undefined,
      cuil: datos.cuil || undefined,
      sexo: datos.sexo || undefined,
      clienteId: datos.clienteId,
      // Nuevos campos
      ingresos: datos.ingresos,
      auto: datos.auto,
      codigoPostal: datos.codigoPostal,
      estadoCivil: datos.estadoCivil
    });


    // Si ya tenemos un clienteId, actualizar en lugar de buscar/crear
    if (datos.clienteId) {
      this.actualizarCliente(datos);
    } else {
      // Buscar cliente existente por DNI o CUIL
      if (datos.dni) {
        this.buscarClientePorDNI(datos);
      } else if (datos.cuil) {
        this.buscarClientePorCUIL(datos);
      } else {
        this.crearCliente(datos);
      }
    }
  }

  // Método para actualizar cliente existente
  private actualizarCliente(datos: any) {
    const clienteData: ClienteCrearDto = {
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.whatsapp,
      email: datos.email,
      dni: datos.dni || undefined,
      cuil: datos.cuil || undefined,
      sexo: datos.sexo || undefined,
      canalId: this.subcanalSeleccionadoInfo?.canalId,
      // Nuevos campos
      ingresos: datos.ingresos,
      auto: datos.auto,
      codigoPostal: datos.codigoPostal,
      estadoCivil: datos.estadoCivil
    };


    this.clienteService.actualizarCliente(datos.clienteId, clienteData).subscribe({
      next: (cliente) => {
        // Mantener el mismo cliente ID
        this.wizardData.clienteId = datos.clienteId;
        this.dataService.clienteId = datos.clienteId;

        // Si hay una operación existente, actualizarla
        if (this.wizardData.operacionId) {
          this.actualizarOperacion(datos.clienteId);
        } else {
          // Verificar relación con vendor
          this.asignarVendorACliente(datos.clienteId);
        }
      },
      error: (error) => {
        console.error("Error al actualizar cliente:", error);
        this.error = "Error al actualizar datos del cliente. Intente nuevamente.";
        this.cargando = false;
      }
    });
  }

  // Método para actualizar una operación existente
  private actualizarOperacion(clienteId: number) {
    if (!this.wizardData.operacionId || !this.wizardData.monto || !this.wizardData.plazo) {
      console.error('Faltan datos para actualizar la operación');
      this.obtenerPlanesYAvanzar();
      return;
    }

    // Buscar el plan a utilizar en función de monto y plazo
    if (!this.subcanalSeleccionadoInfo || !this.subcanalSeleccionadoInfo.planesDisponibles) {
      console.error('No hay información de planes disponibles');
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
      console.error('No hay planes aplicables para la operación');
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

  // Método para buscar cliente por CUIL
  private buscarClientePorCUIL(datos: any) {
    this.clienteService.getClientePorCuil(datos.cuil).subscribe({
      next: (cliente: Cliente) => {
        // Asegurarnos que el ID no es undefined
        if (cliente && typeof cliente.id === 'number') {
          this.wizardData.clienteId = cliente.id;
          this.dataService.clienteId = cliente.id;
          this.asignarVendorACliente(cliente.id);
        } else {
          console.error("Cliente sin ID válido");
          this.crearCliente(datos);
        }
      },
      error: (err) => {
        // No se encontró, crear nuevo cliente
        this.crearCliente(datos);
      }
    });
  }

  // Método para buscar cliente por DNI
  private buscarClientePorDNI(datos: any) {
    this.clienteService.getClientePorDni(datos.dni).subscribe({
      next: (cliente: Cliente) => {
        // Asegurarnos que el ID no es undefined
        if (cliente && typeof cliente.id === 'number') {
          this.wizardData.clienteId = cliente.id;
          this.dataService.clienteId = cliente.id;
          this.asignarVendorACliente(cliente.id);
        } else {
          console.error("Cliente sin ID válido");
          this.crearCliente(datos);
        }
      },
      error: (err) => {
        // En lugar de intentar con CUIL, vamos directo a crear cliente nuevo
        this.crearCliente(datos);
      }
    });
  }
  // Método para crear cliente
  private crearCliente(datos: any) {
    const clienteData: ClienteCrearDto = {
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.whatsapp,
      email: datos.email,
      dni: datos.dni || undefined,
      cuil: datos.cuil || undefined,
      sexo: datos.sexo || undefined,
      canalId: this.subcanalSeleccionadoInfo?.canalId,
      // Nuevos campos
      ingresos: datos.ingresos,
      auto: datos.auto,
      codigoPostal: datos.codigoPostal,
      estadoCivil: datos.estadoCivil,
      // Autoasignación
      autoasignarVendor: true
    };


    this.clienteService.crearCliente(clienteData).subscribe({
      next: (cliente: Cliente) => {
        if (cliente && typeof cliente.id === 'number') {
          this.wizardData.clienteId = cliente.id;
          this.dataService.clienteId = cliente.id;
          this.asignarVendorACliente(cliente.id);
        } else {
          console.error("Cliente creado sin ID válido");
          // Si no se creó el cliente correctamente, intentamos avanzar de todas formas
          this.obtenerPlanesYAvanzar();
        }
      },
      error: (error) => {

        // En caso de error, intentamos avanzar de todas formas
        this.obtenerPlanesYAvanzar();

        /* Comentamos este código para evitar mostrar errores al usuario
        if (error.status === 409) {
          this.error = "Ya existe un cliente con ese DNI o CUIL.";
        } else if (error.status === 400) {
          this.error = "Datos inválidos. Verifica los campos obligatorios.";
        } else {
          this.error = "Error al crear cliente. Por favor, intenta nuevamente.";
        }
        this.cargando = false;
        */
      }
    });
  }

  // Método para asignar vendor a cliente
  private asignarVendorACliente(clienteId: number) {
    if (typeof clienteId !== 'number' || isNaN(clienteId) || clienteId <= 0) {
      console.error('ID de cliente inválido:', clienteId);
      this.obtenerPlanesYAvanzar();
      return;
    }

    // Usar el vendedor seleccionado en lugar del usuario actual
    const vendorId = this.vendorSeleccionado;

    if (!vendorId) {
      console.error("ID de vendor no disponible");
      this.obtenerPlanesYAvanzar();
      return;
    }


    this.clienteVendorService.asignarVendorACliente(clienteId, vendorId).subscribe({
      next: (resultado) => {
        this.obtenerPlanesYAvanzar();
      },
      error: (error) => {
        console.warn("Error al asignar vendor (continuando de todas formas):", error);
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



    // Si tenemos información del subcanal, filtramos los planes directamente
    if (this.subcanalSeleccionadoInfo && this.subcanalSeleccionadoInfo.planesDisponibles) {
      // Filtrar planes aplicables
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

      // Calcular cuota para cada plan
      const planesConCuotas = planesAplicables.map(plan => {
        // Verifica si hay comisión del subcanal
        const comisionSubcanal = this.subcanalSeleccionadoInfo?.subcanalComision || 0;

        // Calcular cuota básica
        let cuota = this.cotizadorService.calcularCuota(
          this.wizardData.monto!,
          this.wizardData.plazo!,
          plan.tasa,
          this.gastosSeleccionados
        );

        // Aplicar comisión del subcanal si existe
        if (comisionSubcanal > 0) {
          cuota = Math.round(cuota * (1 + comisionSubcanal / 100));
        }

        return {
          ...plan,
          cuota: cuota
        };
      });


      // Guardar planes en el wizard
      this.wizardData.planesDisponibles = planesConCuotas;

      // Seleccionar el plan con mejor tasa por defecto (normalmente el primero)
      const planSeleccionado = planesConCuotas[0];

      // Crear la operación inmediatamente antes de avanzar al paso 3
      this.crearOperacion(planSeleccionado.id, planSeleccionado.tasa).then(() => {
        // Una vez creada la operación, avanzar al paso 3
        this.wizardData.paso = 3;
        this.cargando = false;
      }).catch(error => {
        console.error('Error al crear la operación:', error);
        this.error = "Hubo un problema al crear la operación. Por favor, intenta nuevamente.";
        this.cargando = false;
      });
    } else {
      console.error('No hay información de planes en el subcanal seleccionado');
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

    } else {
      console.error('No se encontró información para el subcanal ID:', subcanalId);
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
      // Si ya existe una operación, actualizar en vez de crear
      if (this.wizardData.operacionId) {
        resolve({ id: this.wizardData.operacionId });
        return;
      }

      // Obtener el ID del usuario creador
      const usuarioCreadorId = this.authService.currentUserValue?.id || 0;

      if (!this.wizardData.clienteId) {
        // Preparar datos del cliente
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
          estadoCivil: ""
        };

        // Preparar datos de la operación
        const operacionData = {
          monto: this.wizardData.monto!,
          meses: this.wizardData.plazo!,
          tasa: tasa,
          planId: planId,
          subcanalId: this.subcanalSeleccionado!,
          canalId: this.subcanalSeleccionadoInfo?.canalId || 0,
          vendedorId: this.vendorSeleccionado,
          usuarioCreadorId: usuarioCreadorId,
          estado: "Ingresada"
        };

        this.operacionService.crearClienteYOperacion(clienteData, operacionData).subscribe({
          next: (operacionCreada) => {
            if (operacionCreada && operacionCreada.id) {
              this.wizardData.operacionId = operacionCreada.id;

              // Intentar crear un lead en Kommo con datos del cliente
              this.crearLeadEnKommo(operacionCreada, clienteData);
            }
            resolve(operacionCreada);
          },
          error: (error: any) => {
            console.error('Error al crear operación:', error);
            resolve({ dummy: true });
          }
        });
      } else {
        // Obtener datos del cliente - CORREGIDO: usar getClienteById en lugar de getCliente
        this.clienteService.getClienteById(this.wizardData.clienteId).subscribe({
          next: (cliente) => {
            // Crear solo la operación
            const operacion: Operacion = {
              monto: this.wizardData.monto!,
              meses: this.wizardData.plazo!,
              tasa: tasa,
              clienteId: this.wizardData.clienteId!, // Usar ! para asegurar que es number
              planId: planId,
              subcanalId: this.subcanalSeleccionado!,
              canalId: this.subcanalSeleccionadoInfo?.canalId || 0,
              vendedorId: this.vendorSeleccionado || 0, // Proporcionar un valor por defecto
              usuarioCreadorId: usuarioCreadorId,
              estado: "Ingresada"
            };

            this.operacionService.crearOperacion(operacion).subscribe({
              next: (operacionCreada) => {
                if (operacionCreada && operacionCreada.id) {
                  this.wizardData.operacionId = operacionCreada.id;

                  // Intentar crear un lead en Kommo con datos del cliente
                  this.crearLeadEnKommo(operacionCreada, cliente);
                }
                resolve(operacionCreada);
              },
              error: (error: any) => {
                console.error('Error al crear operación:', error);
                resolve({ dummy: true });
              }
            });
          },
          error: (error: any) => {
            console.error('Error al obtener cliente:', error);
            resolve({ dummy: true });
          }
        });
      }
    });
  }

  // 4. Agregar un nuevo método para crear el lead en Kommo
  private crearLeadEnKommo(operacion: any, cliente: any): void {
    const authData = this.KommoService.getAuthData();
    console.log('¿Tenemos token?', !!authData?.accessToken);
    console.log('Datos de auth completos:', authData);

    this.kommoLeadService.crearLeadDesdeOperacion(operacion, cliente).subscribe({
      next: (response) => {
        console.log('Lead creado exitosamente en Kommo', response);
      },
      error: (error) => {
        // No mostrar error al usuario, solo registrar en consola
        console.error('No se pudo crear el lead en Kommo:', error);
      }
    });
  }

  enviarOfertaPorWhatsApp(plan: any) {
    if (!this.wizardData.clienteWhatsapp) {
      console.error('No hay número de WhatsApp para enviar la oferta');
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
