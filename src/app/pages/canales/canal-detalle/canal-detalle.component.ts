import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, forkJoin } from 'rxjs';

import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';
import { OperacionService, Operacion } from 'src/app/core/services/operacion.service';
import { ModalEditarCanalComponent } from 'src/app/shared/modals/modal-editar-canal/modal-editar-canal.component';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';

@Component({
  selector: 'app-canal-detalle',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    SidebarComponent,
    ModalEditarCanalComponent
  ],
  templateUrl: './canal-detalle.component.html',
  styleUrls: ['./canal-detalle.component.scss']
})
export class CanalDetalleComponent implements OnInit, OnDestroy {
  canalId!: number;
  canal: Canal | null = null;
  loading = true;
  error: string | null = null;
  activeTab = 'general'; // Default active tab

  // Estadísticas
  subcanalesActivos = 0;
  subcanalesInactivos = 0;
  planesActivos = 0;
  planesInactivos = 0;
  totalOperaciones = 0;
  totalVendedores = 0;

  // Sidebar state
  isSidebarCollapsed = false;
  private sidebarSubscription: Subscription | null = null;

  // Modal states
  modalEditarOpen = false;

  // Datos cargados
  subcanales: Subcanal[] = [];
  vendedores: any[] = [];
  operaciones: Operacion[] = [];
  clientes: Cliente[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private canalService: CanalService,
    private subcanalService: SubcanalService,
    private usuarioService: UsuarioService,
    private operacionService: OperacionService,
    private clienteService: ClienteService,
    private sidebarStateService: SidebarStateService
  ) { }

  ngOnInit() {
    // Get canal ID from route params
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.canalId = +params['id'];
        this.loadCanalData();
      } else {
        this.error = 'ID de canal no encontrado';
        this.loading = false;
      }
    });

    // Subscribe to sidebar state changes
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

  loadCanalData() {
    this.loading = true;

    // Obtener el canal principal
    this.canalService.getCanalDetalles(this.canalId).subscribe({
      next: (canal) => {
        this.canal = canal;
        this.calculateBaseStatistics();

        // Cargar datos adicionales en paralelo
        this.loadAdditionalData();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del canal.';
        console.error('Error cargando canal:', err);
        this.loading = false;
      }
    });
  }

  loadAdditionalData() {
    // Usamos forkJoin para manejar múltiples solicitudes en paralelo
    forkJoin({
      subcanales: this.subcanalService.getSubcanales(), // Filtramos en el cliente
      vendedores: this.usuarioService.getUsuariosPorRol(3), // Rol 3 = Vendors, filtrar por canal en el cliente
      operaciones: this.operacionService.getOperaciones(), // Filtramos en el cliente
      clientes: this.clienteService.getClientesPorCanal(this.canalId)
    }).subscribe({
      next: (result) => {
        // Filtramos subcanales de este canal
        this.subcanales = result.subcanales.filter(s => s.canalId === this.canalId);

        // Filtramos vendedores de este canal (suponiendo que tienen canalId)
        this.vendedores = result.vendedores.filter(v => {
          // Verificar si el vendedor está asignado a algún subcanal de este canal
          return this.subcanales.some(s =>
            s.vendors && Array.isArray(s.vendors) &&
            s.vendors.some(vendor => vendor.id === v.id)
          );
        });

        // Filtramos operaciones de este canal
        this.operaciones = result.operaciones.filter(o => o.canalId === this.canalId);

        // Clientes ya vienen filtrados por canal
        this.clientes = result.clientes;

        // Actualizar estadísticas
        this.updateStatistics();

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando datos adicionales:', err);
        // Mostramos error pero no bloqueamos la vista
        this.loading = false;
      }
    });
  }

  calculateBaseStatistics() {
    if (!this.canal) return;

    // Estadísticas básicas del canal
    this.subcanalesActivos = this.canal.subcanales?.filter(s => s.activo).length || 0;
    this.subcanalesInactivos = (this.canal.subcanales?.length || 0) - this.subcanalesActivos;

    this.planesActivos = this.canal.planesCanal?.filter(p => p.activo).length || 0;
    this.planesInactivos = (this.canal.planesCanal?.length || 0) - this.planesActivos;

    this.totalOperaciones = this.canal.numeroOperaciones || 0;
  }

  updateStatistics() {
    // Actualizar estadísticas con datos adicionales
    this.totalVendedores = this.vendedores.length;

    // Más estadísticas si es necesario...
  }

  // Change active tab
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Navigate back to canales list
  goBack() {
    this.router.navigate(['/canales']);
  }

  // Abrir modal para editar canal
  editCanal() {
    this.modalEditarOpen = true;
  }

  // Cerrar modal de edición
  cerrarModalEditar() {
    this.modalEditarOpen = false;
  }

  // Manejar actualización de canal desde el modal
  onCanalActualizado(canal: Canal) {
    this.loadCanalData(); // Recargar todos los datos
  }

  // Format date string
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  }

  // Get badge class based on active status
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Navigate to subcanal detail
  verDetalleSubcanal(subcanalId: number) {
    this.router.navigate(['/subcanales', subcanalId]);
  }
}
