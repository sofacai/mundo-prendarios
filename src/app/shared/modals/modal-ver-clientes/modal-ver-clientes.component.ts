import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ClienteService, Cliente } from 'src/app/core/services/cliente.service';

@Component({
  selector: 'app-modal-ver-cliente',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './modal-ver-clientes.component.html',
  styleUrls: ['./modal-ver-clientes.component.scss']
})
export class ModalVerClienteComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() clienteId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();

  cliente: Cliente | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private clienteService: ClienteService,
    private renderer: Renderer2
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.handleModalOpen();
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && !changes['isOpen'].firstChange) {
      this.handleModalClose();
    }

    // Cargar datos del cliente cuando cambia el ID
    if (changes['clienteId'] && changes['clienteId'].currentValue && this.isOpen) {
      this.cargarCliente(changes['clienteId'].currentValue);
    }
  }

  handleModalOpen() {
    // Si tenemos un ID de cliente, cargamos sus datos
    if (this.clienteId) {
      this.cargarCliente(this.clienteId);
    }

    // Calculamos el ancho de la barra de desplazamiento
    const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

    // Añadir clase al body cuando se abre el modal
    this.renderer.addClass(document.body, 'modal-open');

    // Establece un padding-right al body para compensar la barra de desplazamiento
    this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
    console.log('Modal de visualización de cliente abierto');
  }

  handleModalClose() {
    // Remover clase y estilos cuando se cierra el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    console.log('Modal de visualización de cliente cerrado');
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarCliente(id: number) {
    this.loading = true;
    this.clienteService.getClienteById(id).subscribe({
      next: (cliente) => {
        this.cliente = cliente;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del cliente.';
        console.error('Error cargando cliente:', err);
        this.loading = false;
      }
    });
  }

  cerrarModal() {
    // Limpiar errores
    this.error = null;
    this.cliente = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  // Formatear números
  formatNumber(value: number): string {
    if (value === undefined || value === null) return '0';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Formatear fechas
  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'No disponible';

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }
}
