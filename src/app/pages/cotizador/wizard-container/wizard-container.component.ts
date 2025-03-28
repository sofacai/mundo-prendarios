import { Step1MontoComponent } from '../step1-monto/step1-monto.component';
import { Step2DatosComponent } from '../step2-datos/step2-datos.component';
import { Step3OfertaComponent } from '../step3-oferta/step3-oferta.component';
import { SubcanalSelectorComponent } from "../subcanal-selector/subcanal-selector.component";
import { RolType } from 'src/app/core/models/usuario.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatosWizard, SubcanalInfo, CotizadorService } from 'src/app/core/services/cotizador.service';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';
import { OperacionService } from 'src/app/core/services/operacion.service';
import { ClienteVendorService } from 'src/app/core/services/cliente-vendor.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

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
  planesDisponibles?: any[];
}

@Component({
  selector: 'app-wizard-container',
  templateUrl: './wizard-container.component.html',
  styleUrls: ['./wizard-container.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, Step1MontoComponent, Step2DatosComponent, SubcanalSelectorComponent, Step3OfertaComponent]
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

  constructor(
    private authService: AuthService,
    private cotizadorService: CotizadorService,
    private clienteService: ClienteService,
    private clienteVendorService: ClienteVendorService,
    private operacionService: OperacionService,
    private cdr: ChangeDetectorRef

  ) {}

  ngOnInit() {
    this.verificarAcceso();
    this.cargarDatosIniciales();
  }

  verificarAcceso() {
    const user = this.authService.currentUserValue;
    if (!user || user.rolId !== RolType.Vendor) {
      this.error = "Solo usuarios con rol Vendor pueden acceder al cotizador.";
    }
  }

  cargarDatosIniciales() {
    this.cargando = true;

    this.cotizadorService.getDatosWizard().subscribe({
      next: (datos) => {
        console.log('Datos recibidos:', datos);
        this.datosWizard = datos;
        this.cargando = false;

        if (datos.subcanales && datos.subcanales.length > 0) {
          // Filtrar solo subcanales activos
          const subcanalesActivos = datos.subcanales.filter(subcanal => subcanal.subcanalActivo);
          console.log('Subcanales activos:', subcanalesActivos);

          if (subcanalesActivos.length === 0) {
            this.error = "No tienes subcanales activos asignados. Comunícate con tu administrador.";
            return;
          }

          // Si hay múltiples subcanales activos, mostrar selector
          if (subcanalesActivos.length > 1) {
            this.necesitaSeleccionarSubcanal = true;
          }
          // Si solo hay un subcanal activo, seleccionarlo automáticamente
          else {
            this.seleccionarSubcanalPorId(subcanalesActivos[0].subcanalId);
            this.necesitaSeleccionarSubcanal = false;
          }
        } else {
          this.error = "No se encontraron subcanales asignados a tu usuario.";
        }
      },
      error: (error) => {
        console.error('Error al cargar datos iniciales:', error);
        this.error = "Error al cargar datos necesarios para la cotización.";
        this.cargando = false;
      }
    });
  }

  continuarPaso1(datos: {monto: number, plazo: number}) {
    console.log('Ejecutando continuarPaso1 con datos:', datos);
    this.wizardData.monto = datos.monto;
    this.wizardData.plazo = datos.plazo;
    this.wizardData.paso = 2;
    console.log('Pasando a paso 2', this.wizardData);

    // Crear un nuevo objeto para asegurar detección de cambios
    this.wizardData = { ...this.wizardData };

    // Forzar detección de cambios
    this.cdr.detectChanges();

    // Timeout para asegurar que la UI se actualice
    setTimeout(() => {
      console.log('Estado actual después del timeout:', this.wizardData);
      this.cdr.detectChanges();
    }, 100);
  }

  continuarPaso2(datos: any) {
    this.cargando = true;
    this.error = null;

    // Guardar datos del cliente en el wizard
    this.wizardData = {
      ...this.wizardData,
      clienteNombre: datos.nombre,
      clienteApellido: datos.apellido,
      clienteWhatsapp: datos.whatsapp,
      clienteEmail: datos.email,
      clienteDni: datos.dni || "",
      clienteCuil: datos.cuil || ""
    };

    // Primero buscar por DNI si está disponible
    if (datos.dni) {
      this.buscarClientePorDNI(datos);
    }
    // Si no hay DNI pero sí CUIL
    else if (datos.cuil) {
      this.buscarClientePorCUIL(datos);
    }
    // Si no hay ni DNI ni CUIL, crear directamente
    else {
      this.crearCliente(datos);
    }
  }

 // Método para buscar cliente por CUIL
private buscarClientePorCUIL(datos: any) {
  this.clienteService.getClientePorCuil(datos.cuil).subscribe({
    next: (cliente: Cliente) => {
      console.log("Cliente encontrado por CUIL:", cliente);
      // Asegurarnos que el ID no es undefined
      if (cliente && typeof cliente.id === 'number') {
        this.wizardData.clienteId = cliente.id;
        this.asignarVendorACliente(cliente.id);
      } else {
        console.error("Cliente sin ID válido");
        this.crearCliente(datos);
      }
    },
    error: (_) => {
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
        this.asignarVendorACliente(cliente.id);
      } else {
        console.error("Cliente sin ID válido");
        if (datos.cuil) {
          this.buscarClientePorCUIL(datos);
        } else {
          this.crearCliente(datos);
        }
      }
    },
    error: (_) => {
      // No se encontró por DNI, intentar con CUIL si existe
      if (datos.cuil) {
        this.buscarClientePorCUIL(datos);
      } else {
        // Si no hay CUIL, crear nuevo cliente
        this.crearCliente(datos);
      }
    }
  });
}

// Método para crear cliente
private crearCliente(datos: any) {
  const clienteData = {
    nombre: datos.nombre,
    apellido: datos.apellido,
    telefono: datos.whatsapp,
    email: datos.email,
    dni: String(datos.dni || ""),
    cuil: String(datos.cuil || ""),
    canalId: this.subcanalSeleccionadoInfo?.canalId || 1
  };

  console.log("Creando nuevo cliente:", clienteData);

  this.clienteService.crearCliente(clienteData).subscribe({
    next: (cliente: Cliente) => {
      console.log("Cliente creado con éxito:", cliente);
      if (cliente && typeof cliente.id === 'number') {
        this.wizardData.clienteId = cliente.id;
        this.asignarVendorACliente(cliente.id);
      } else {
        console.error("Cliente creado sin ID válido");
        this.obtenerPlanesYAvanzar();
      }
    },
    error: (error) => {
      console.error("Error al crear cliente:", error);
      if (error.status === 409) {
        this.error = "Ya existe un cliente con ese DNI o CUIL.";
      } else if (error.status === 400) {
        this.error = "Datos inválidos. Verifica los campos obligatorios.";
      } else {
        this.error = "Error al crear cliente. Por favor, intenta nuevamente.";
      }
      this.cargando = false;
    }
  });
}

// Método para asignar vendor a cliente
private asignarVendorACliente(clienteId: number) {
  // Es crucial que clienteId sea un número válido en este punto
  if (typeof clienteId !== 'number' || isNaN(clienteId) || clienteId <= 0) {
    console.error('ID de cliente inválido:', clienteId);
    this.obtenerPlanesYAvanzar();
    return;
  }

  const vendorId = this.authService.currentUserValue?.id;

  if (!vendorId) {
    console.error("ID de vendor no disponible");
    this.obtenerPlanesYAvanzar();
    return;
  }

  console.log(`Asignando vendor ${vendorId} al cliente ${clienteId}`);

  this.clienteVendorService.asignarVendorACliente(clienteId, vendorId).subscribe({
    next: (resultado) => {
      console.log("Vendor asignado exitosamente al cliente:", resultado);
      this.obtenerPlanesYAvanzar();
    },
    error: (error) => {
      console.error("Error al asignar vendor:", error);
      // Continuar de todas formas
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
        const cuota = this.cotizadorService.calcularCuota(
          this.wizardData.monto!,
          this.wizardData.plazo!,
          plan.tasa,
          this.gastosSeleccionados
        );

        return {
          ...plan,
          cuota: cuota
        };
      });

      console.log('Planes con cuotas calculadas:', planesConCuotas);

      // Guardar planes y avanzar al paso 3
      this.wizardData.planesDisponibles = planesConCuotas;
      this.wizardData.paso = 3;
      this.cargando = false;
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

    // Preparar los datos del cliente
    const clienteData = {
      nombre: this.wizardData.clienteNombre || "",
      apellido: this.wizardData.clienteApellido || "",
      whatsapp: this.wizardData.clienteWhatsapp || "",
      telefono: this.wizardData.clienteWhatsapp || "",
      email: this.wizardData.clienteEmail || "",
      dni: this.wizardData.clienteDni || "",
      cuil: this.wizardData.clienteCuil || ""
    };

    // Preparar los datos de la operación
    const operacionData = {
      monto: this.wizardData.monto,
      meses: this.wizardData.plazo,
      tasa: planSeleccionado.tasa,
      planId: planId,
      subcanalId: this.subcanalSeleccionado,
      canalId: this.subcanalSeleccionadoInfo?.canalId || 0
    };

    // Crear cliente y operación en una sola llamada
    this.operacionService.crearClienteYOperacion(clienteData, operacionData).subscribe({
      next: (operacionCreada) => {
        console.log('Operación creada con éxito:', operacionCreada);
        this.cargando = false;

        // También enviamos por WhatsApp si es necesario
        this.enviarOfertaPorWhatsApp(planSeleccionado);
      },
      error: (error) => {
        console.error('Error al crear operación:', error);
        this.error = "Error al guardar la oferta. Por favor, intenta nuevamente.";
        this.cargando = false;
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
      this.wizardData.paso--;
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
    this.wizardData = {
      paso: 1
    };
    this.cargarDatosIniciales();
  }
}
