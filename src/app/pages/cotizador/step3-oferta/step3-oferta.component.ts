import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CotizadorDataService } from 'src/app/core/services/cotizador-data.service';
import { SidebarStateService } from 'src/app/core/services/sidebar-state.service';

@Component({
  selector: 'app-step3-oferta',
  templateUrl: './step3-oferta.component.html',
  styleUrls: ['./step3-oferta.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class Step3OfertaComponent implements OnInit {
  @Input() clienteNombre: string = '';
  @Input() clienteApellido: string = '';
  @Input() monto: number = 0;
  @Input() plazo: number = 0;
  @Input() planes: any[] = [];
  @Output() seleccionarPlan = new EventEmitter<number>();
  @Output() volver = new EventEmitter<void>();
  @Output() realizarOtraOferta = new EventEmitter<void>();

  showPaymentDetail: boolean = false;
  cuotas: number[] = [];
  valorCuota: number = 0;
  planSeleccionado: any = {};

  constructor(private dataService: CotizadorDataService,   private sidebarStateService: SidebarStateService
  ) {}

  ngOnInit() {
    // Usar el primer plan disponible o el plan seleccionado en los pasos anteriores
    if (this.planes && this.planes.length > 0) {
      this.planSeleccionado = this.planes[0];
      this.valorCuota = this.planSeleccionado.cuota;

      // Generar las cuotas (en este caso todas iguales)
      this.generarCuotas();
    } else {
      // Fallback a datos del servicio si los planes no están definidos como Input
      this.monto = this.dataService.monto;
      this.plazo = this.dataService.plazo;
      this.valorCuota = this.dataService.valorCuota;
      this.planSeleccionado = {
        nombre: this.dataService.planTipo,
        id: this.dataService.planId
      };

      // Generar las cuotas
      this.generarCuotas();
    }
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleCotizadorSidebar();
  }

  togglePaymentDetail() {
    this.showPaymentDetail = !this.showPaymentDetail;
  }

  generarCuotas() {
    // Generar array de cuotas (por simplicidad todas iguales)
    this.cuotas = Array(this.plazo).fill(this.valorCuota);

    // En un caso real, aquí se podría aplicar lógica para cuotas diferentes
    // Por ejemplo, para inflación o tasas crecientes
  }

  enviarPorWhatsapp() {
    if (this.planSeleccionado && this.planSeleccionado.id) {
      this.seleccionarPlan.emit(this.planSeleccionado.id);
    } else {
      console.error('No hay plan seleccionado para enviar');
    }
  }

  // Helper para mostrar el nombre completo
  get nombreCompleto(): string {
    return `${this.clienteNombre} ${this.clienteApellido}`;
  }
}
