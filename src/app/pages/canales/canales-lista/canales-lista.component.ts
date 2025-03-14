import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { CanalFormComponent } from 'src/app/shared/modals/canal-form/canal-form.component';

@Component({
  selector: 'app-canales-lista',
  standalone: true,
  imports: [CommonModule, SidebarComponent, IonicModule, CanalFormComponent],
  templateUrl: './canales-lista.component.html',
  styleUrls: ['./canales-lista.component.scss']
})
export class CanalesListaComponent implements OnInit {
  canales: Canal[] = [];
  loading = true;
  error: string | null = null;
  modalOpen = false;
  scrollbarWidth: number = 0;

  constructor(
    private canalService: CanalService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.loadCanales();
    // Calcular el ancho de la barra de desplazamiento
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  }

  loadCanales() {
    this.loading = true;
    this.canalService.getCanales().subscribe({
      next: (data) => {
        this.canales = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar canales:', err);
        this.error = 'No se pudieron cargar los canales. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  // Navegar al detalle del canal
  verDetalle(id: number): void {
    this.router.navigate(['/canales', id]);
  }

  // Devuelve el conteo de planes activos
  getPlanesCantidad(canal: Canal): number {
    return canal.planesCanal.filter(pc => pc.activo).length;
  }

  // Devuelve la cantidad de subcanales
  getSubcanalesCantidad(canal: Canal): number {
    return canal.subcanales.length;
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Abre el modal para nuevo canal
  abrirModalNuevoCanal() {
    this.modalOpen = true;

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

  // Cierra el modal
  cerrarModal() {
    this.modalOpen = false;

    // Restaurar el estado original
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    if (contentArea) {
      this.renderer.removeClass(contentArea, 'content-area-with-modal');
      this.renderer.removeStyle(document.body, 'position');
      this.renderer.removeStyle(document.body, 'width');
      this.renderer.removeStyle(document.body, 'overflow-y');
    }
  }

  // Maneja la creación de un canal
  onCanalCreado(canal: Canal) {
    this.canales.push(canal);
  }
}
