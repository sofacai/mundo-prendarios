import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SubcanalService } from 'src/app/core/services/subcanal.service';

@Component({
  selector: 'app-modal-ver-subcanal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './modal-ver-subcanal.component.html',
  styleUrls: ['./modal-ver-subcanal.component.scss']
})
export class ModalVerSubcanalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() subcanalId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() editRequest = new EventEmitter<number>();

  subcanal: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private subcanalService: SubcanalService,
    private renderer: Renderer2
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.handleModalOpen();
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && !changes['isOpen'].firstChange) {
      this.handleModalClose();
    }

    // Cargar datos del subcanal cuando cambia el ID
    if (changes['subcanalId'] && changes['subcanalId'].currentValue && this.isOpen) {
      this.cargarSubcanal(changes['subcanalId'].currentValue);
    }
  }

  handleModalOpen() {
    // Si tenemos un ID de subcanal, cargamos sus datos
    if (this.subcanalId) {
      this.cargarSubcanal(this.subcanalId);
    }

    // Calculamos el ancho de la barra de desplazamiento
    const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

    // Añadir clase al body cuando se abre el modal
    this.renderer.addClass(document.body, 'modal-open');

    // Establece un padding-right al body para compensar la barra de desplazamiento
    this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
  }

  handleModalClose() {
    // Remover clase y estilos cuando se cierra el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarSubcanal(id: number) {
    this.loading = true;
    this.subcanalService.getSubcanal(id).subscribe({
      next: (subcanal) => {
        this.subcanal = subcanal;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del subcanal.';
        console.error('Error cargando subcanal:', err);
        this.loading = false;
      }
    });
  }

  cerrarModal() {
    // Limpiar errores
    this.error = null;
    this.subcanal = null;

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  editarSubcanal() {
    if (this.subcanal) {
      this.editRequest.emit(this.subcanal.id);
    }
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Calcular el porcentaje total de gastos
  getGastosPorcentaje(): string {
    if (!this.subcanal || !this.subcanal.gastos || this.subcanal.gastos.length === 0) {
      return '0%';
    }

    const totalPorcentaje = this.subcanal.gastos.reduce((total: number, gasto: any) => total + gasto.porcentaje, 0);
    return `${totalPorcentaje}%`;
  }
}
