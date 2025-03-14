import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { PlanService, Plan } from 'src/app/core/services/plan.service';
import { PlanFormComponent } from 'src/app/shared/modals/plan-form/plan-form.component';

@Component({
  selector: 'app-planes-lista',
  standalone: true,
  imports: [CommonModule, SidebarComponent, IonicModule, PlanFormComponent],
  templateUrl: './planes-lista.component.html',
  styleUrls: ['./planes-lista.component.scss']
})
export class PlanesListaComponent implements OnInit {
  planes: Plan[] = [];
  loading = true;
  error: string | null = null;
  modalOpen = false;
  scrollbarWidth: number = 0;

  constructor(
    private planService: PlanService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.loadPlanes();
    // Calcular el ancho de la barra de desplazamiento
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  }

  loadPlanes() {
    this.loading = true;
    this.planService.getPlanes().subscribe({
      next: (data) => {
        this.planes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar planes:', err);
        this.error = 'No se pudieron cargar los planes. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  verDetalle(id: number): void {
    this.router.navigate(['/planes', id]);
  }

  formatCuotas(cuotasAplicablesList: number[]): string {
    return cuotasAplicablesList.join(', ');
  }

  formatMonto(monto: number): string {
    return monto.toLocaleString('es-AR');
  }

  formatTasa(tasa: number): string {
    return tasa.toFixed(2) + '%';
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  // Abre el modal para nuevo plan
  abrirModalNuevoPlan() {
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

  // Maneja la creación de un plan
  onPlanCreado(plan: Plan) {
    // Agregar el nuevo plan a la lista
    this.planes.push(plan);

    // Opcionalmente, puedes ordenar la lista después de añadir el plan
    // Por ejemplo, ordenar por ID de forma descendente para mostrar primero los más recientes
    this.planes.sort((a, b) => b.id - a.id);
  }
}
