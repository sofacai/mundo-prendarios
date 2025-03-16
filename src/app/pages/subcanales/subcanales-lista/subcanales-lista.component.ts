import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { SubcanalFormComponent } from 'src/app/shared/modals/subcanal-form/subcanal-form.component';
import { ModalEditarSubcanalComponent } from 'src/app/shared/modals/modal-editar-subcanal/modal-editar-subcanal.component';
import { ModalVerSubcanalComponent } from 'src/app/shared/modals/modal-ver-subcanal/modal-ver-subcanal.component';

@Component({
  selector: 'app-subcanales-lista',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    IonicModule,
    SubcanalFormComponent,
    ModalEditarSubcanalComponent,
    ModalVerSubcanalComponent
  ],
  templateUrl: './subcanales-lista.component.html',
  styleUrls: ['./subcanales-lista.component.scss']
})
export class SubcanalesListaComponent implements OnInit {
  subcanales: Subcanal[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  subcanalIdEditar: number | null = null;
  subcanalIdVer: number | null = null;
  scrollbarWidth: number = 0;

  constructor(
    private subcanalService: SubcanalService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.loadSubcanales();
    // Calcular el ancho de la barra de desplazamiento
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  }

  loadSubcanales() {
    // Si ya está cargando, no hacer nada
    if (this.loading) return;

    this.loading = true;
    console.log('Cargando lista de subcanales...');

    this.subcanalService.getSubcanales().subscribe({
      next: (data) => {
        this.subcanales = data;
        console.log(`${data.length} subcanales cargados`);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar subcanales:', err);
        this.error = 'No se pudieron cargar los subcanales. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  // Navegar al detalle del subcanal
  verDetalle(id: number): void {
    console.log(`Abriendo detalle del subcanal ${id}`);
    // Primero establecemos el ID
    this.subcanalIdVer = id;

    // Luego abrimos el modal (setTimeout para evitar doble carga)
    setTimeout(() => {
      this.modalVerOpen = true;
      this.manejarAperturaModal();
    }, 0);
  }

  // Abrir modal para editar subcanal
  abrirModalEditarSubcanal(id: number): void {
    console.log(`Abriendo modal para editar subcanal ${id}`);
    // Primero asignamos el ID
    this.subcanalIdEditar = id;

    // Luego abrimos el modal (esto evita múltiples cargas)
    setTimeout(() => {
      this.modalEditarOpen = true;
      this.manejarAperturaModal();
    }, 0);
  }

  // Cierra el modal de visualización
  cerrarModalVer() {
    console.log('Cerrando modal de visualización');
    this.modalVerOpen = false;
    this.subcanalIdVer = null;
    this.manejarCierreModal();
  }

  // Cierra el modal de edición
  cerrarModalEditar() {
    console.log('Cerrando modal de edición');
    this.modalEditarOpen = false;
    this.subcanalIdEditar = null;
    this.manejarCierreModal();
  }

  // Maneja la solicitud de edición desde el modal de visualización
  onEditarSolicitado(id: number) {
    console.log(`Solicitando editar subcanal ${id} desde modal de visualización`);
    // Cerrar modal de visualización
    this.modalVerOpen = false;
    this.subcanalIdVer = null;

    // Abrir modal de edición
    setTimeout(() => {
      this.abrirModalEditarSubcanal(id);
    }, 300); // Pequeño retraso para evitar superposición de modales
  }

  // Calcular el porcentaje total de gastos
  getGastosPorcentaje(subcanal: Subcanal): string {
    if (!subcanal.gastos || subcanal.gastos.length === 0) {
      return '0%';
    }

    const totalPorcentaje = subcanal.gastos.reduce((total, gasto) => total + gasto.porcentaje, 0);
    return `${totalPorcentaje}%`;
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Abre el modal para nuevo subcanal
  abrirModalNuevoSubcanal() {
    console.log('Abriendo modal para nuevo subcanal');
    this.modalOpen = true;
    this.manejarAperturaModal();
  }

  // Cierra el modal de creación
  cerrarModal() {
    console.log('Cerrando modal de creación');
    this.modalOpen = false;
    this.manejarCierreModal();
  }

  // Maneja la creación de un subcanal
  onSubcanalCreado(subcanal: Subcanal) {
    console.log('Subcanal creado:', subcanal);
    this.loadSubcanales(); // Recargar lista completa para asegurar datos actualizados
  }

  // Maneja la actualización de un subcanal
  onSubcanalActualizado(subcanal: Subcanal) {
    console.log('Subcanal actualizado:', subcanal);
    this.loadSubcanales(); // Recargar lista completa para asegurar datos actualizados
  }

  // Funciones helper para manejar estilos del body
  private manejarAperturaModal() {
    // Añadir clase al cuerpo para mantener la barra de desplazamiento
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      this.renderer.addClass(contentArea, 'content-area-with-modal');
      // Fijar la posición del body para evitar desplazamiento
      this.renderer.setStyle(document.body, 'position', 'fixed');
      this.renderer.setStyle(document.body, 'width', '100%');
      this.renderer.setStyle(document.body, 'overflow-y', 'scroll');
    }
  }

  private manejarCierreModal() {
    // Solo restaurar si no hay ningún otro modal abierto
    if (!this.modalOpen && !this.modalEditarOpen && !this.modalVerOpen) {
      const contentArea = document.querySelector('.content-area') as HTMLElement;
      if (contentArea) {
        this.renderer.removeClass(contentArea, 'content-area-with-modal');
        this.renderer.removeStyle(document.body, 'position');
        this.renderer.removeStyle(document.body, 'width');
        this.renderer.removeStyle(document.body, 'overflow-y');
      }
    }
  }
}
