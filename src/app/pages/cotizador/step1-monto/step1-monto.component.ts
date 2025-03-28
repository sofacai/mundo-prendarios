import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CotizadorService, SubcanalInfo } from 'src/app/core/services/cotizador.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-step1-monto',
  templateUrl: './step1-monto.component.html',
  styleUrls: ['./step1-monto.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class Step1MontoComponent implements OnInit {
  @Input() subcanalInfo: SubcanalInfo | null = null;
  @Output() continuar = new EventEmitter<{monto: number, plazo: number}>();
  @Output() volver = new EventEmitter<void>();

  monto: number = 1000000;
  plazo: number = 36;
  plazosDisponibles: number[] = [12, 24, 36, 48, 60];
  montoMinimo: number = 50000;
  montoMaximo: number = 5000000;

  errorMensaje: string | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    // Si tenemos información del subcanal, obtenemos límites y plazos de sus planes
    if (this.subcanalInfo && this.subcanalInfo.planesDisponibles && this.subcanalInfo.planesDisponibles.length > 0) {
      const planes = this.subcanalInfo.planesDisponibles;

      // Calculamos los límites globales a partir de todos los planes
      this.montoMinimo = Math.min(...planes.map(plan => plan.montoMinimo));
      this.montoMaximo = Math.max(...planes.map(plan => plan.montoMaximo));

      // Obtenemos todos los plazos disponibles sin duplicados
      const todosPlazos: number[] = [];
      planes.forEach(plan => {
        plan.cuotasAplicables.forEach(cuota => {
          todosPlazos.push(cuota);
        });
      });
      this.plazosDisponibles = [...new Set(todosPlazos)].sort((a, b) => a - b);

      // Preseleccionamos un plazo intermedio disponible
      if (this.plazosDisponibles.length > 0) {
        this.plazo = this.plazosDisponibles[Math.floor(this.plazosDisponibles.length / 2)];
      }

      // Preseleccionamos un monto intermedio entre min y max
      this.monto = Math.round((this.montoMinimo + this.montoMaximo) / 2);
    } else {
      this.errorMensaje = "No se encontraron planes disponibles para este subcanal.";
    }
  }

  onVolver() {
    this.volver.emit();
  }

  onSliderChange(event: any) {
    this.monto = event.detail.value;
  }

  seleccionarPlazo(plazo: number) {
    this.plazo = plazo;
  }

  onContinuar() {
    if (!this.subcanalInfo || !this.subcanalInfo.planesDisponibles) {
      this.errorMensaje = "No hay planes disponibles.";
      return;
    }

    // Validar si el monto y plazo están dentro de algún plan disponible
    const planValido = this.subcanalInfo.planesDisponibles.some(plan =>
      this.monto >= plan.montoMinimo &&
      this.monto <= plan.montoMaximo &&
      plan.cuotasAplicables.includes(this.plazo)
    );

    if (!planValido) {
      this.errorMensaje = "No hay planes disponibles para el monto y plazo seleccionados.";
      return;
    }

    this.continuar.emit({
      monto: this.monto,
      plazo: this.plazo
    });
  }


}
