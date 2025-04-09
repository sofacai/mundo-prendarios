// Archivo: src/app/pages/canales/components/canal-vendedores/canal-vendedores.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperacionService } from 'src/app/core/services/operacion.service';

@Component({
  selector: 'app-canal-vendedores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canal-vendedores.component.html',
  styleUrls: ['./canal-vendedores.component.scss']
})
export class CanalVendedoresComponent implements OnInit {
  @Input() vendedores: any[] = [];
  @Input() loadingVendedores: Map<number, boolean> = new Map();

  @Output() toggleEstado = new EventEmitter<{vendorId: number, estadoActual: boolean}>();
  @Output() verDetalle = new EventEmitter<number>();

  // Mapa para almacenar las operaciones liquidadas por vendedor
  operacionesLiquidadasMap = new Map<number, number>();

  constructor(private operacionService: OperacionService) { }

  ngOnInit(): void {
    this.cargarOperacionesLiquidadas();
  }

  // Método para cargar operaciones liquidadas de cada vendedor
  cargarOperacionesLiquidadas(): void {
    if (this.vendedores && this.vendedores.length > 0) {
      this.vendedores.forEach(vendedor => {
        // Obtener todas las operaciones del vendedor
        this.operacionService.getOperaciones().subscribe({
          next: (operaciones) => {
            // Filtrar por vendedor y estado liquidado
            const operacionesLiquidadas = operaciones.filter(
              op => op.vendedorId === vendedor.id && op.estado === 'Liquidada'
            ).length;

            this.operacionesLiquidadasMap.set(vendedor.id, operacionesLiquidadas);
          },
          error: (err) => {
            console.error(`Error al cargar operaciones para vendedor ${vendedor.id}:`, err);
            this.operacionesLiquidadasMap.set(vendedor.id, 0);
          }
        });
      });
    }
  }

  // Método para obtener el total de operaciones liquidadas para un vendedor
  getOperacionesLiquidadas(vendorId: number): number {
    return this.operacionesLiquidadasMap.get(vendorId) || 0;
  }

  onToggleEstado(vendorId: number, estadoActual: boolean): void {
    this.toggleEstado.emit({ vendorId, estadoActual });
  }

  onVerDetalle(vendorId: number): void {
    this.verDetalle.emit(vendorId);
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  isVendorLoading(vendorId: number): boolean {
    return this.loadingVendedores.get(vendorId) === true;
  }
}
