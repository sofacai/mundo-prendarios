import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

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

  constructor() {}

  ngOnInit() {}

  onSeleccionarPlan(planId: number) {
    this.seleccionarPlan.emit(planId);
  }

  onVolver() {
    this.volver.emit();
  }

  onRealizarOtraOferta() {
    this.realizarOtraOferta.emit();
  }

  // Helper para mostrar el nombre completo
  get nombreCompleto(): string {
    return `${this.clienteNombre} ${this.clienteApellido}`;
  }
}
