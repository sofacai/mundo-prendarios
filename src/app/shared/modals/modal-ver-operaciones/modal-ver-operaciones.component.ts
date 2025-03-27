import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { OperacionService } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-modal-ver-operacion',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './modal-ver-operaciones.component.html',
  styleUrls: ['./modal-ver-operaciones.component.scss']
})
export class ModalVerOperacionComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() operacionId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();

  operacion: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private operacionService: OperacionService,
    private renderer: Renderer2
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.handleModalOpen();
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && !changes['isOpen'].firstChange) {
      this.handleModalClose();
    }

    // Cargar datos de la operación cuando cambia el ID
    if (changes['operacionId'] && changes['operacionId'].currentValue && this.isOpen) {
      this.cargarOperacion(changes['operacionId'].currentValue);
    }
  }

  handleModalOpen() {
    // Si tenemos un ID de operación, cargamos sus datos
    if (this.operacionId) {
      this.cargarOperacion(this.operacionId);
    }

    // Calculamos el ancho de la barra de desplazamiento
    const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

    // Añadir clase al body cuando se abre el modal
    this.renderer.addClass(document.body, 'modal-open');

    // Establece un padding-right al body para compensar la barra de desplazamiento
    this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
    console.log('Modal de visualización de operación abierto');
  }

  handleModalClose() {
    // Remover clase y estilos cuando se cierra el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    console.log('Modal de visualización de operación cerrado');
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarOperacion(id: number) {
    this.loading = true;
    this.operacionService.getOperacionById(id).subscribe({
      next: (operacion) => {
        this.operacion = operacion;

        // Determinar estado de la operación de forma segura
        let estado = 'Activo'; // Valor por defecto

        try {
          let fechaCreacion;
          if (operacion.fechaCreacion) {
            fechaCreacion = new Date(operacion.fechaCreacion);
            const hoy = new Date();
            const mesesTranscurridos = (hoy.getFullYear() - fechaCreacion.getFullYear()) * 12 +
                                      hoy.getMonth() - fechaCreacion.getMonth();

            if (mesesTranscurridos >= operacion.meses) {
              estado = 'Completado';
            } else if (mesesTranscurridos <= 0) {
              estado = 'Pendiente';
            }
          }
        } catch (error) {
          console.error('Error al procesar la fecha:', error);
        }

        this.operacion.estado = estado;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos de la operación.';
        console.error('Error cargando operación:', err);
        this.loading = false;
      }
    });
  }

  cerrarModal() {
    // Limpiar errores
    this.error = null;
    this.operacion = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return 'badge-success';
      case 'pendiente':
        return 'badge-warning';
      case 'completado':
        return 'badge-info';
      case 'cancelado':
        return 'badge-danger';
      default:
        return 'badge-light';
    }
  }

  // Formatear números
  formatNumber(value: number): string {
    if (value === undefined || value === null) return '0';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Formatear fechas
  formatDate(dateString: string): string {
    if (!dateString) return 'No disponible';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  // Calcular fecha de finalización
  calcularFechaFinalizacion(fechaCreacion: string, meses: number): string {
    if (!fechaCreacion || !meses) return 'No disponible';

    try {
      const fechaInicio = new Date(fechaCreacion);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaInicio.getMonth() + meses);

      return fechaFin.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'No disponible';
    }
  }
}
