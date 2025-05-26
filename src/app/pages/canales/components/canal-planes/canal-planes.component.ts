// En canal-planes.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Canal, PlanCanal, CanalService } from 'src/app/core/services/canal.service';
import { Plan, PlanService } from 'src/app/core/services/plan.service';

@Component({
  selector: 'app-canal-planes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-planes.component.html',
  styleUrls: ['./canal-planes.component.scss']
})
export class CanalPlanesComponent implements OnInit {
  @Input() canal!: Canal;
  @Output() verDetalle = new EventEmitter<number>();


  planesDisponibles: Plan[] = [];
  loading = false;
  loadingAction = false;
  error: string | null = null;

  constructor(
    private planService: PlanService,
    private canalService: CanalService
  ) {}

  ngOnInit() {
    this.cargarPlanesDisponibles();
  }

  cargarPlanesDisponibles() {
    this.loading = true;
    this.planService.getPlanesActivos().subscribe({
      next: (planes) => {
        // Filtrar planes ya asignados al canal
        const planesAsignados = this.canal.planesCanal?.map(pc => pc.planId) || [];
        this.planesDisponibles = planes.filter(plan => !planesAsignados.includes(plan.id));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los planes disponibles.';
        this.loading = false;
      }
    });
  }

  onToggleEstado(planCanalId: number, estadoActual: boolean): void {
    this.loadingAction = true;

    // Llamar al método apropiado según el estado actual
    const accion = estadoActual ?
      this.canalService.desactivarPlanCanal(planCanalId) :
      this.canalService.activarPlanCanal(planCanalId);

    accion.subscribe({
      next: () => {
        // Actualizar estado en la UI
        if (this.canal.planesCanal) {
          const index = this.canal.planesCanal.findIndex(pc => pc.id === planCanalId);
          if (index !== -1) {
            this.canal.planesCanal[index].activo = !estadoActual;
          }
        }
        this.loadingAction = false;
      },
      error: (err) => {
        this.error = 'No se pudo cambiar el estado del plan. Intente nuevamente.';
        this.loadingAction = false;
      }
    });
  }

  onAsignarPlan(planId: number): void {
    this.loadingAction = true;

    this.canalService.asignarPlanACanal(this.canal.id, planId).subscribe({
      next: (planCanal) => {
        // Buscar el plan completo para agregarlo al canal
        const plan = this.planesDisponibles.find(p => p.id === planId);

        if (plan) {
          // Remover de planes disponibles
          this.planesDisponibles = this.planesDisponibles.filter(p => p.id !== planId);

          // Agregar a planes del canal
          if (!this.canal.planesCanal) {
            this.canal.planesCanal = [];
          }

          // Crear un objeto con la estructura de PlanCanal
          const nuevoPlanCanal: PlanCanal = {
            id: planCanal.id, // ID devuelto por la API
            planId: planId,
            canalId: this.canal.id,
            activo: true,
            plan: plan
          };

          this.canal.planesCanal.push(nuevoPlanCanal);
        }

        this.loadingAction = false;
      },
      error: (err) => {
        this.error = 'No se pudo asignar el plan. Intente nuevamente.';
        this.loadingAction = false;
      }
    });
  }

  onDesasignarPlan(planCanalId: number): void {
    this.loadingAction = true;

    this.canalService.eliminarPlanCanal(planCanalId).subscribe({
      next: () => {
        if (this.canal.planesCanal) {
          // Encontrar plan antes de eliminarlo para poder agregarlo a disponibles
          const planCanal = this.canal.planesCanal.find(pc => pc.id === planCanalId);

          if (planCanal) {
            // Agregar a planes disponibles
            this.planesDisponibles.push(planCanal.plan);

            // Eliminar de planes del canal
            this.canal.planesCanal = this.canal.planesCanal.filter(pc => pc.id !== planCanalId);
          }
        }

        this.loadingAction = false;
      },
      error: (err) => {
        this.error = 'No se pudo eliminar el plan. Intente nuevamente.';
        this.loadingAction = false;
      }
    });
  }


  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  onVerDetalle(planId: number): void {
    this.verDetalle.emit(planId);
  }


}
