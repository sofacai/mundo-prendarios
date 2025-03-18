import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';

export interface OperacionDto {
  id: number;
  nombreCliente: string;
  apellidoCliente: string;
  plan: string;
  meses: number;
  gasto: number;
  monto: number;
  estado: string;
}

@Component({
  selector: 'app-operaciones-lista',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    IonicModule
  ],
  templateUrl: './operaciones-lista.component.html',
  styleUrls: ['./operaciones-lista.component.scss']
})
export class OperacionesListaComponent implements OnInit {
  operaciones: OperacionDto[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    this.loadOperaciones();
  }

  loadOperaciones() {
    this.loading = true;

    // Datos de ejemplo para mostrar en la tabla
    setTimeout(() => {
      this.operaciones = [
        {
          id: 1,
          nombreCliente: 'Juan',
          apellidoCliente: 'Pérez',
          plan: 'Plan UVA',
          meses: 12,
          gasto: 5,
          monto: 15000,
          estado: 'Activo'
        },
        {
          id: 2,
          nombreCliente: 'María',
          apellidoCliente: 'González',
          plan: 'Plan UVA',
          meses: 6,
          gasto: 2.5,
          monto: 7500,
          estado: 'Pendiente'
        },
        {
          id: 3,
          nombreCliente: 'Carlos',
          apellidoCliente: 'Rodríguez',
          plan: 'Plan Tradicional',
          meses: 24,
          gasto: 8,
          monto: 24000,
          estado: 'Completado'
        }
      ];
      this.loading = false;
    }, 1000);
  }

  verDetalle(id: number): void {
    console.log(`Ver detalle de la operación ${id}`);
    // Implementación futura
    // this.router.navigate(['/operaciones', id]);
  }

  getEstadoClass(estado: string): string {
    switch (estado.toLowerCase()) {
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

  formatNumber(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}
