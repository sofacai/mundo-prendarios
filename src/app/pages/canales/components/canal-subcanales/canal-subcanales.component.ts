// Archivo: src/app/pages/canales/components/canal-subcanales/canal-subcanales.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subcanal } from 'src/app/core/services/subcanal.service';
import { OperacionService } from 'src/app/core/services/operacion.service';
import { SubcanalFormComponent } from 'src/app/shared/modals/subcanal-form/subcanal-form.component';


@Component({
  selector: 'app-canal-subcanales',
  standalone: true,
  imports: [CommonModule, SubcanalFormComponent],
  templateUrl: './canal-subcanales.component.html',
  styleUrls: ['./canal-subcanales.component.scss']
})
export class CanalSubcanalesComponent implements OnInit {
  @Input() subcanales: Subcanal[] = [];
  @Input() loading: boolean = false;
  @Input() loadingSubcanales: Map<number, boolean> = new Map();

  @Input() canalId: number | null = null;
@Output() subcanalCreado = new EventEmitter<Subcanal>();
modalFormOpen = false;

  @Output() toggleEstado = new EventEmitter<{subcanalId: number, estadoActual: boolean}>();
  @Output() verDetalle = new EventEmitter<number>();

  // Mapa para almacenar las operaciones liquidadas por subcanal
  operacionesLiquidadasMap = new Map<number, number>();

  constructor(private operacionService: OperacionService) { }

  ngOnInit(): void {
    this.cargarOperacionesLiquidadas();
  }

  cargarOperacionesLiquidadas(): void {
    if (this.subcanales && this.subcanales.length > 0) {
      this.subcanales.forEach(subcanal => {
        this.operacionService.getOperacionesPorSubcanal(subcanal.id)
          .subscribe({
            next: (operaciones) => {
              // Contar operaciones liquidadas
              const total = operaciones.filter(op => op.estado && op.estado.toLowerCase() === 'liquidada').length;
              this.operacionesLiquidadasMap.set(subcanal.id, total);
            },
            error: (err) => {
              console.error(`Error al cargar operaciones para subcanal ${subcanal.id}:`, err);
              this.operacionesLiquidadasMap.set(subcanal.id, 0); // Valor por defecto en caso de error
            }
          });
      });
    }
  }

  onAgregarSubcanal(): void {
    this.modalFormOpen = true;
  }

  onCloseModal(): void {
    this.modalFormOpen = false;
  }

  onSubcanalCreado(subcanal: Subcanal): void {
    this.subcanalCreado.emit(subcanal);
  }

  // Método para obtener el total de operaciones liquidadas para un subcanal
  getOperacionesLiquidadas(subcanalId: number): number {
    return this.operacionesLiquidadasMap.get(subcanalId) || 0;
  }

  onToggleEstado(subcanalId: number, estadoActual: boolean): void {
    this.toggleEstado.emit({ subcanalId, estadoActual });
  }

  onVerDetalle(subcanalId: number): void {
    this.verDetalle.emit(subcanalId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  isSubcanalLoading(subcanalId: number): boolean {
    return this.loadingSubcanales.get(subcanalId) === true;
  }
}
