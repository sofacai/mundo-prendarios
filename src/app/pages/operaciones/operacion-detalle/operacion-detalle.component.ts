import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AlertController, ModalController } from '@ionic/angular';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { OperacionService, Operacion } from 'src/app/core/services/operacion.service';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { RolType } from 'src/app/core/models/usuario.model';
import { Subscription } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SafePipe } from 'src/app/shared/pipes/safe.pipe';


@Component({
  selector: 'app-operacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SidebarComponent,
    SafePipe
  ],
  templateUrl: './operacion-detalle.component.html',
  styleUrls: ['./operacion-detalle.component.scss']
})


export class OperacionDetalleComponent implements OnInit, OnDestroy {
  operacionId!: number;
  operacion!: Operacion;
  cliente: Cliente | null = null;
  vendor: UsuarioDto | null = null;
  canal: Canal | null = null;
  subcanal: Subcanal | null = null;
  showObservacionesModal = false;

  // Modals de fecha
  showEditarFechaAprobacionModal = false;
  showEditarFechaProcLiqModal = false;
  showEditarFechaLiquidacionModal = false;
  fechaAprobacionInput = '';
  fechaProcLiqInput = '';
  fechaLiquidacionInput = '';

  // Variable para controlar la visualización del documento
  showDocumentPreview = false;
  documentUrl = '';
  documentType: 'image' | 'pdf' | 'other' = 'other';

  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  loading = true;
  error: string | null = null;

  // --- MODALES PERSONALIZADOS ---
  showMensajeExito = false;
  showMensajeError = false;
  showConfirmarQuitarFechaAprobacion = false;
  showConfirmarQuitarFechaProcLiq = false;
  showConfirmarQuitarFechaLiquidacion = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private operacionService: OperacionService,
    private clienteService: ClienteService,
    private usuarioService: UsuarioService,
    private canalService: CanalService,
    private subcanalService: SubcanalService,
    private sidebarStateService: SidebarStateService,
    private alertController: AlertController,
    private modalController: ModalController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.operacionId = +params['id'];
        this.cargarOperacion();
      } else {
        this.error = 'ID de operación no encontrado';
        this.loading = false;
      }
    });

    this.isSidebarCollapsed = this.sidebarStateService.getInitialState();
    this.sidebarSubscription = this.sidebarStateService.collapsed$.subscribe(
      collapsed => {
        this.isSidebarCollapsed = collapsed;
        this.adjustContentArea();
      }
    );
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  private adjustContentArea() {
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      if (this.isSidebarCollapsed) {
        contentArea.style.marginLeft = '70px'; // Ancho del sidebar colapsado
      } else {
        contentArea.style.marginLeft = '260px'; // Ancho del sidebar expandido
      }
    }
  }

  verDetalleSubcanal(id: number): void {
    this.router.navigate(['/subcanales', id]);
  }

  verDetalleCanal(id: number): void {
    this.router.navigate(['/canales', id]);
  }

  verDetalleUsuario(id: number): void {
    this.router.navigate(['/usuarios', id]);
  }

  cargarOperacion() {
    this.loading = true;
    this.error = null;

    this.operacionService.getOperacionById(this.operacionId).subscribe({
      next: (operacion) => {
        this.operacion = operacion;

        // Cargar datos relacionados en paralelo
        this.cargarCliente(operacion.clienteId);
        if (operacion.vendedorId) {
          this.cargarVendor(operacion.vendedorId);
        }
        if (operacion.canalId) {
          this.cargarCanal(operacion.canalId);
        }
        if (operacion.subcanalId) {
          this.cargarSubcanal(operacion.subcanalId);
        }
      },
      error: (err) => {
        this.error = 'No se pudo cargar la información de la operación';
        this.loading = false;
      }
    });
  }

  cargarCliente(clienteId: number) {
    this.clienteService.getClienteById(clienteId).subscribe({
      next: (cliente) => {
        this.cliente = cliente;
        this.checkLoadingComplete();
      },
      error: (err) => {
        this.checkLoadingComplete();
      }
    });
  }

  cargarVendor(vendedorId: number) {
    this.usuarioService.getUsuario(vendedorId).subscribe({
      next: (vendor) => {
        this.vendor = vendor;
        this.checkLoadingComplete();
      },
      error: (err) => {
        this.checkLoadingComplete();
      }
    });
  }

  cargarCanal(canalId: number) {
    this.canalService.getCanal(canalId).subscribe({
      next: (canal) => {
        this.canal = canal;
        this.checkLoadingComplete();
      },
      error: (err) => {
        this.checkLoadingComplete();
      }
    });
  }

  cargarSubcanal(subcanalId: number) {
    this.subcanalService.getSubcanal(subcanalId).subscribe({
      next: (subcanal) => {
        this.subcanal = subcanal;
        this.checkLoadingComplete();
      },
      error: (err) => {
        this.checkLoadingComplete();
      }
    });
  }

  checkLoadingComplete() {
    this.loading = false;
  }

  goBack() {
    this.router.navigate(['/operaciones']);
  }

  // Métodos de formato
  formatMonto(monto: number): string {
    // Formatear sin centavos
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'No disponible';

    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getEstadoClass(estado: string): string {

    return this.operacionService.getEstadoClass(estado);
  }

  // Mostrar observaciones en un popup
  mostrarObservaciones() {
    this.showObservacionesModal = true;
    // Prevenir scroll en el body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  cerrarModalObservaciones(event?: MouseEvent) {
    // Si se hizo clic fuera del contenido del modal, cerrarlo
    if (event && (event.target as HTMLElement).classList.contains('custom-modal-backdrop')) {
      this.showObservacionesModal = false;
      document.body.style.overflow = '';
    } else if (!event) {
      // Si se llamó sin evento (por ejemplo, al hacer clic en el botón de cerrar)
      this.showObservacionesModal = false;
      document.body.style.overflow = '';
    }
  }
  // Previsualizar documento
  verDocumento() {
    if (this.operacion.urlAprobadoDefinitivo) {
      this.documentUrl = this.operacion.urlAprobadoDefinitivo;

      // Determinar el tipo de documento
      const url = this.operacion.urlAprobadoDefinitivo.toLowerCase();
      if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif')) {
        this.documentType = 'image';
      } else if (url.endsWith('.pdf')) {
        this.documentType = 'pdf';
      } else {
        this.documentType = 'other';
      }

      this.showDocumentPreview = true;
    }
  }

  cerrarModalAlClickearFuera(event: MouseEvent) {
    // Verificar si el clic fue fuera del contenido del modal
    if ((event.target as HTMLElement).classList.contains('document-preview-overlay')) {
      this.cerrarVistaDocumento();
    }
  }

  cerrarVistaDocumento() {
    this.showDocumentPreview = false;
  }

  // Verificar si el usuario es admin
  isAdmin(): boolean {
    return this.authService.hasRole(RolType.Administrador);
  }

  // Editar fecha de aprobación
  editarFechaAprobacion() {
    this.fechaAprobacionInput = this.operacion.fechaAprobacion ? this.formatDateForInput(this.operacion.fechaAprobacion) : '';
    this.showEditarFechaAprobacionModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Editar fecha de proceso de liquidación
  editarFechaProcLiq() {
    this.fechaProcLiqInput = this.operacion.fechaProcLiq ? this.formatDateForInput(this.operacion.fechaProcLiq) : '';
    this.showEditarFechaProcLiqModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Editar fecha de liquidación
  editarFechaLiquidacion() {
    this.fechaLiquidacionInput = this.operacion.fechaLiquidacion ? this.formatDateForInput(this.operacion.fechaLiquidacion) : '';
    this.showEditarFechaLiquidacionModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Quitar fecha de aprobación
  quitarFechaAprobacion() {
    this.abrirModalConfirmarQuitarFechaAprobacion();
  }

  // Lógica original de quitar fecha de aprobación (solo ejecutar tras confirmar)
  private ejecutarQuitarFechaAprobacion() {
    this.actualizarFechaAprobacion(null);
  }

  // Quitar fecha de proceso de liquidación
  quitarFechaProcLiq() {
    this.abrirModalConfirmarQuitarFechaProcLiq();
  }

  // Lógica para quitar fecha de proceso de liquidación
  private ejecutarQuitarFechaProcLiq() {
    this.actualizarFechaProcLiq(null);
  }

  // Quitar fecha de liquidación
  quitarFechaLiquidacion() {
    this.abrirModalConfirmarQuitarFechaLiquidacion();
  }

  // Confirmar quitar fecha de proceso de liquidación
  confirmarQuitarFechaProcLiq() {
    this.showConfirmarQuitarFechaProcLiq = false;
    this.ejecutarQuitarFechaProcLiq();
  }

  abrirModalConfirmarQuitarFechaProcLiq() {
    this.showConfirmarQuitarFechaProcLiq = true;
  }

  cerrarModalConfirmarQuitarFechaProcLiq(event?: MouseEvent) {
    if (!event || event.target === event.currentTarget) {
      this.showConfirmarQuitarFechaProcLiq = false;
    }
  }

  // Confirmar quitar fecha de liquidación (llamado desde el modal personalizado)
  confirmarQuitarFechaLiquidacion() {
    this.showConfirmarQuitarFechaLiquidacion = false;
    this.ejecutarQuitarFechaLiquidacion();
  }

  abrirModalConfirmarQuitarFechaLiquidacion() {
    this.showConfirmarQuitarFechaLiquidacion = true;
  }
  cerrarModalConfirmarQuitarFechaLiquidacion(event?: MouseEvent) {
    if (!event || event.target === event.currentTarget) {
      this.showConfirmarQuitarFechaLiquidacion = false;
    }
  }

  // Cerrar modals de fecha
  cerrarModalFechaAprobacion(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).classList.contains('custom-modal-backdrop')) {
      this.showEditarFechaAprobacionModal = false;
      document.body.style.overflow = '';
    } else if (!event) {
      this.showEditarFechaAprobacionModal = false;
      document.body.style.overflow = '';
    }
  }

  cerrarModalFechaProcLiq(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).classList.contains('custom-modal-backdrop')) {
      this.showEditarFechaProcLiqModal = false;
      document.body.style.overflow = '';
    } else if (!event) {
      this.showEditarFechaProcLiqModal = false;
      document.body.style.overflow = '';
    }
  }

  cerrarModalFechaLiquidacion(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).classList.contains('custom-modal-backdrop')) {
      this.showEditarFechaLiquidacionModal = false;
      document.body.style.overflow = '';
    } else if (!event) {
      this.showEditarFechaLiquidacionModal = false;
      document.body.style.overflow = '';
    }
  }

  // Guardar fechas
  guardarFechaAprobacion() {
    if (this.fechaAprobacionInput) {
      this.actualizarFechaAprobacion(new Date(this.fechaAprobacionInput));
    }
    this.cerrarModalFechaAprobacion();
  }

  guardarFechaProcLiq() {
    if (this.fechaProcLiqInput) {
      this.actualizarFechaProcLiq(new Date(this.fechaProcLiqInput));
    }
    this.cerrarModalFechaProcLiq();
  }

  guardarFechaLiquidacion() {
    if (this.fechaLiquidacionInput) {
      this.actualizarFechaLiquidacion(new Date(this.fechaLiquidacionInput));
    }
    this.cerrarModalFechaLiquidacion();
  }

  // Actualizar fecha de aprobación
  private actualizarFechaAprobacion(fecha: Date | null) {
    this.operacionService.actualizarFechaAprobacion(this.operacionId, fecha).subscribe({
      next: (operacion) => {
        this.operacion = operacion;
        this.mostrarmensajeExito('Fecha de aprobación actualizada correctamente');
      },
      error: (err) => {
        this.mostrarmensajeError('Error al actualizar la fecha de aprobación');
      }
    });
  }

  // Actualizar fecha de proceso de liquidación
  private actualizarFechaProcLiq(fecha: Date | null) {
    this.operacionService.actualizarFechaProcLiq(this.operacionId, fecha).subscribe({
      next: (operacion) => {
        this.operacion = operacion;
        this.mostrarmensajeExito('Fecha de proceso de liquidación actualizada correctamente');
      },
      error: (err) => {
        this.mostrarmensajeError('Error al actualizar la fecha de proceso de liquidación');
      }
    });
  }

  // Actualizar fecha de liquidación
  private actualizarFechaLiquidacion(fecha: Date | null) {
    this.operacionService.actualizarFechaLiquidacion(this.operacionId, fecha).subscribe({
      next: (operacion) => {
        this.operacion = operacion;
        this.mostrarmensajeExito('Fecha de liquidación actualizada correctamente');
      },
      error: (err) => {
        this.mostrarmensajeError('Error al actualizar la fecha de liquidación');
      }
    });
  }

  // Formatear fecha para input datetime-local
  private formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  }

  // Mostrar mensaje de éxito
  private async mostrarMensajeExito(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Éxito',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  // Mostrar mensaje de error
  private async mostrarMensajeError(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  mostrarmensajeExito(mensaje: string) {
    this.mensajeExito = mensaje;
    this.showMensajeExito = true;
  }

  mostrarmensajeError(mensaje: string) {
    this.mensajeError = mensaje;
    this.showMensajeError = true;
  }

  cerrarModalMensajeExito(event?: MouseEvent) {
    if (!event || event.target === event.currentTarget) {
      this.showMensajeExito = false;
    }
  }
  cerrarModalMensajeError(event?: MouseEvent) {
    if (!event || event.target === event.currentTarget) {
      this.showMensajeError = false;
    }
  }

  // Confirmar quitar fecha de aprobación
  abrirModalConfirmarQuitarFechaAprobacion() {
    this.showConfirmarQuitarFechaAprobacion = true;
  }
  cerrarModalConfirmarQuitarFechaAprobacion(event?: MouseEvent) {
    if (!event || event.target === event.currentTarget) {
      this.showConfirmarQuitarFechaAprobacion = false;
    }
  }
  confirmarQuitarFechaAprobacion() {
    this.showConfirmarQuitarFechaAprobacion = false;
    this.ejecutarQuitarFechaAprobacion();
  }

  // Corregir llamada a this.ejecutarQuitarFechaLiquidacion (asegurar que exista)
  private ejecutarQuitarFechaLiquidacion() {
    this.actualizarFechaLiquidacion(null);
  }
}
