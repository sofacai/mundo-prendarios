import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { ModalVerSubcanalComponent } from '../modal-ver-subcanal/modal-ver-subcanal.component';
import { ModalEditarSubcanalComponent } from '../modal-editar-subcanal/modal-editar-subcanal.component';

@Component({
  selector: 'app-modal-ver-canal',
  standalone: true,
  imports: [CommonModule, IonicModule, ModalVerSubcanalComponent, ModalEditarSubcanalComponent],
  templateUrl: './modal-ver-canal.component.html',
  styleUrls: ['./modal-ver-canal.component.scss']
})
export class ModalVerCanalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() canalId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() editRequest = new EventEmitter<number>();

  canal: Canal | null = null;
  loading = false;
  error: string | null = null;

  // Control para modales de subcanal
  modalVerSubcanalOpen = false;
  modalEditarSubcanalOpen = false;
  subcanalIdVer: number | null = null;
  subcanalIdEditar: number | null = null;

  constructor(
    private canalService: CanalService,
    private renderer: Renderer2
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.handleModalOpen();
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && !changes['isOpen'].firstChange) {
      this.handleModalClose();
    }

    // Cargar datos del canal cuando cambia el ID
    if (changes['canalId'] && changes['canalId'].currentValue && this.isOpen) {
      this.cargarCanal(changes['canalId'].currentValue);
    }
  }

  handleModalOpen() {
    // Si tenemos un ID de canal, cargamos sus datos
    if (this.canalId) {
      this.cargarCanal(this.canalId);
    }

    // Calculamos el ancho de la barra de desplazamiento
    const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

    // Añadir clase al body cuando se abre el modal
    this.renderer.addClass(document.body, 'modal-open');

    // Establece un padding-right al body para compensar la barra de desplazamiento
    this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
    console.log('Modal de visualización del canal abierto');
  }

  handleModalClose() {
    // Remover clase y estilos cuando se cierra el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    console.log('Modal de visualización del canal cerrado');
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarCanal(id: number) {
    this.loading = true;
    this.canalService.getCanalDetalles(id).subscribe({
      next: (canal) => {
        this.canal = canal;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del canal.';
        console.error('Error cargando canal:', err);
        this.loading = false;
      }
    });
  }

  cerrarModal() {
    // Limpiar errores
    this.error = null;
    this.canal = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  editarCanal() {
    if (this.canal) {
      this.editRequest.emit(this.canal.id);
    }
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Métodos para manejar subcanales
  verDetalleSubcanal(subcanalId: number) {
    this.subcanalIdVer = subcanalId;
    this.modalVerSubcanalOpen = true;
    console.log('Abriendo modal de subcanal:', subcanalId);
  }

  cerrarModalVerSubcanal() {
    this.modalVerSubcanalOpen = false;
    this.subcanalIdVer = null;
  }

  onEditarSubcanalSolicitado(subcanalId: number) {
    console.log('Solicitud para editar subcanal:', subcanalId);
    // Cerrar el modal de ver subcanal
    this.cerrarModalVerSubcanal();

    // Abrir el modal de editar subcanal
    setTimeout(() => {
      this.subcanalIdEditar = subcanalId;
      this.modalEditarSubcanalOpen = true;
    }, 300); // Pequeño retraso para evitar superposición de modales
  }

  cerrarModalEditarSubcanal() {
    this.modalEditarSubcanalOpen = false;
    this.subcanalIdEditar = null;
  }

  onSubcanalActualizado(subcanal: any) {
    console.log('Subcanal actualizado:', subcanal);
    // Recargar el canal para ver los cambios actualizados
    if (this.canalId) {
      this.cargarCanal(this.canalId);
    }
  }
}
