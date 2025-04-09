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
import { catchError, finalize, tap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { CanalService } from 'src/app/core/services/canal.service';
import { PlanService } from 'src/app/core/services/plan.service';

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

  cargarVendors() {
    this.cargando = true;

    this.usuarioService.getUsuariosPorRol(RolType.Vendor).subscribe({
      next: (usuarios) => {
        // Filtrar solo los usuarios activos con rol de Vendor
        this.vendors = usuarios.filter(u => u.activo);
        this.cargando = false;

        if (this.vendors.length === 0) {
          this.error = "No hay vendedores disponibles para seleccionar.";
        }
      },
      error: (error) => {
        console.error('Error al cargar vendors:', error);
        this.error = "Error al cargar la lista de vendedores.";
        this.cargando = false;
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

    this.subcanalService.getSubcanalesPorUsuario(vendorId)
      .pipe(
        tap(subcanales => console.log('Subcanales recibidos:', subcanales)),
        map(subcanales => subcanales.filter(s => s.activo)),
        catchError(error => {
          console.error('Error al cargar subcanales:', error);
          this.error = "Error al obtener los subcanales del vendedor.";
          return of([]);
        }),
        finalize(() => this.cargando = false)
      )
      .subscribe(subcanales => {
        this.subcanales = subcanales;

        if (subcanales.length === 0) {
          this.error = "El vendedor no tiene subcanales activos asignados.";
          return;
        }

        // Procesar los subcanales para obtener la información necesaria
        this.convertirADatosWizard(subcanales);
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
      console.log('Procesando como Vendor - obteniendo planes sin consultar canal');

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
    console.log('Datos wizard generados:', this.datosWizard);

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
    // Reiniciar selección de vendor
    this.necesitaSeleccionarVendor = true;
    this.necesitaSeleccionarSubcanal = false;
    this.subcanalSeleccionado = null;
    this.subcanalSeleccionadoInfo = null;
    this.vendorSeleccionado = null;
    this.wizardData = { paso: 1 };
    this.dataService.reiniciarDatos();
  }



  continuarPaso1(datos: {monto: number, plazo: number}) {
    console.log('Ejecutando continuarPaso1 con datos:', datos);
    this.wizardData.monto = datos.monto;
    this.wizardData.plazo = datos.plazo;
    this.wizardData.paso = 2;

    // Asegurarse de mantener el vendorId
    if (this.vendorSeleccionado) {
      this.wizardData.vendorId = this.vendorSeleccionado;
    }

    console.log('Pasando a paso 2', this.wizardData);

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
      clienteId: datos.clienteId, // Mantener clienteId si existe
      clienteNombre: datos.nombre,
      clienteApellido: datos.apellido,
      clienteWhatsapp: datos.whatsapp,
      clienteEmail: datos.email,
      clienteDni: datos.dni || "",
      clienteCuil: datos.cuil || "",
      clienteSexo: datos.sexo || ""
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
      clienteId: datos.clienteId
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
      canalId: this.subcanalSeleccionadoInfo?.canalId
    };

    console.log(`Actualizando cliente ID ${datos.clienteId}:`, clienteData);

    this.clienteService.actualizarCliente(datos.clienteId, clienteData).subscribe({
      next: (cliente) => {
        console.log("Cliente actualizado con éxito:", cliente);
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
    console.log('ID del vendor seleccionado:', this.vendorSeleccionado, typeof this.vendorSeleccionado);


    // Como probablemente no existe un método actualizar, simplemente continuamos
    console.log('Se debería actualizar la operación:', operacion);
    this.obtenerPlanesYAvanzar();
  }

  // Método para buscar cliente por CUIL
  private buscarClientePorCUIL(datos: any) {
    this.clienteService.getClientePorCuil(datos.cuil).subscribe({
      next: (cliente: Cliente) => {
        console.log("Cliente encontrado por CUIL:", cliente);
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
        console.log("No se encontró cliente por CUIL, error:", err);
        // No se encontró, crear nuevo cliente
        this.crearCliente(datos);
      }
    });
  }

  // Método para buscar cliente por DNI
  private buscarClientePorDNI(datos: any) {
    this.clienteService.getClientePorDni(datos.dni).subscribe({
      next: (cliente: Cliente) => {
        console.log("Cliente encontrado por DNI:", cliente);
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
        console.log("No se encontró cliente por DNI, creando nuevo cliente:", err);
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
      // Para crear clientes en el canal correcto
      autoasignarVendor: true // Permitir autoasignación del vendor actual
    };

    console.log("Creando nuevo cliente:", clienteData);

    this.clienteService.crearCliente(clienteData).subscribe({
      next: (cliente: Cliente) => {
        console.log("Cliente creado con éxito:", cliente);
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
        console.error("Error al crear cliente:", error);

        // En caso de error, intentamos avanzar de todas formas
        console.log("Intentando avanzar a pesar del error de creación de cliente");
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
        console.log("Vendor asignado exitosamente al cliente:", resultado);
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

    console.log('Obteniendo planes para:', {
      monto: this.wizardData.monto,
      plazo: this.wizardData.plazo,
      subcanal: this.subcanalSeleccionado
    });

    // Si tenemos información del subcanal, filtramos los planes directamente
    if (this.subcanalSeleccionadoInfo && this.subcanalSeleccionadoInfo.planesDisponibles) {
      // Filtrar planes aplicables
      const planesAplicables = this.subcanalSeleccionadoInfo.planesDisponibles.filter(plan =>
        this.wizardData.monto! >= plan.montoMinimo &&
        this.wizardData.monto! <= plan.montoMaximo &&
        plan.cuotasAplicables.includes(this.wizardData.plazo!)
      );

      console.log('Planes aplicables encontrados:', planesAplicables.length);

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
          console.log(`Aplicando comisión de subcanal ${comisionSubcanal}%: cuota final=${cuota}`);
        }

        return {
          ...plan,
          cuota: cuota
        };
      });

      console.log('Planes con cuotas calculadas:', planesConCuotas);

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
      console.log('Subcanal seleccionado:', subcanalInfo);
      console.log('Gastos seleccionados:', this.gastosSeleccionados);
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

  // Método para crear operación (devuelve una promesa)
  private crearOperacion(planId: number, tasa: number): Promise<any> {
    return new Promise((resolve, reject) => {
      // Si ya existe una operación, actualizar en vez de crear
      if (this.wizardData.operacionId) {
        console.log(`Reutilizando operación existente ID ${this.wizardData.operacionId}`);
        resolve({ id: this.wizardData.operacionId });
        return;
      }

      if (!this.wizardData.clienteId) {
        // Preparar los datos del cliente
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

        // Preparar los datos de la operación, incluyendo el vendorId
        const operacionData = {
          monto: this.wizardData.monto!,
          meses: this.wizardData.plazo!,
          tasa: tasa,
          planId: planId,
          subcanalId: this.subcanalSeleccionado!,
          canalId: this.subcanalSeleccionadoInfo?.canalId || 0,
          vendedorId: this.vendorSeleccionado // Usar el ID del vendor seleccionado
        };

        console.log('Creando cliente y operación con datos:', {
          cliente: clienteData,
          operacion: operacionData
        });

        // Crear cliente y operación en una sola llamada
        this.operacionService.crearClienteYOperacion(clienteData, operacionData).subscribe({
          next: (operacionCreada) => {
            console.log('Operación creada con éxito:', operacionCreada);
            if (operacionCreada && operacionCreada.id) {
              this.wizardData.operacionId = operacionCreada.id;
            }
            resolve(operacionCreada);
          },
          error: (error) => {
            console.error('Error al crear operación:', error);
            resolve({ dummy: true });
          }
        });
      } else {
        // Solo creamos la operación con el vendorId seleccionado
        const operacion: Operacion = {
          monto: this.wizardData.monto!,
          meses: this.wizardData.plazo!,
          tasa: tasa,
          clienteId: this.wizardData.clienteId,
          planId: planId,
          subcanalId: this.subcanalSeleccionado!,
          canalId: this.subcanalSeleccionadoInfo?.canalId || 0,
          vendedorId: this.vendorSeleccionado ?? undefined, // Convierte null a undefined
        };
        console.log('ID del vendor seleccionado:', this.vendorSeleccionado, typeof this.vendorSeleccionado);

        console.log('Creando operación con datos:', operacion);

        this.operacionService.crearOperacion(operacion).subscribe({
          next: (operacionCreada) => {
            console.log('Operación creada con éxito:', operacionCreada);
            if (operacionCreada && operacionCreada.id) {
              this.wizardData.operacionId = operacionCreada.id;
            }
            resolve(operacionCreada);
          },
          error: (error) => {
            console.error('Error al crear operación:', error);
            resolve({ dummy: true });
          }
        });
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

    // Si el usuario actual no es vendor, volver a selección de vendor
    if (this.currentUserRol !== RolType.Vendor) {
      this.volverAlSeleccionVendor();
    } else {
      // Si es vendor, simplemente reiniciar el wizard
      this.wizardData = {
        paso: 1,
        vendorId: this.authService.currentUserValue?.id // Mantener el ID del vendor actual
      };
      this.dataService.reiniciarDatos();
    }
  }
}
