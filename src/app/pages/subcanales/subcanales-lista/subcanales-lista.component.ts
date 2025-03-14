import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { SubcanalFormComponent } from 'src/app/shared/modals/subcanal-form/subcanal-form.component';
import { UsuarioDto } from 'src/app/core/services/usuario.service';

@Component({
  selector: 'app-subcanales-lista',
  standalone: true,
  imports: [CommonModule, SidebarComponent, IonicModule, SubcanalFormComponent],
  templateUrl: './subcanales-lista.component.html',
  styleUrls: ['./subcanales-lista.component.scss']
})
export class SubcanalesListaComponent implements OnInit {
  subcanales: Subcanal[] = [];
  loading = true;
  error: string | null = null;
  modalOpen = false;

  constructor(
    private subcanalService: SubcanalService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadSubcanales();
  }

  loadSubcanales() {
    this.loading = true;
    this.subcanalService.getSubcanales().subscribe({
      next: (data) => {
        this.subcanales = data;
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
    this.router.navigate(['/subcanales', id]);
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
    this.modalOpen = true;
  }

  // Cierra el modal
  cerrarModal() {
    this.modalOpen = false;
  }

  // Maneja la creación de un subcanal
  onSubcanalCreado(subcanal: Subcanal) {
    this.subcanales.push(subcanal);
  }


}
