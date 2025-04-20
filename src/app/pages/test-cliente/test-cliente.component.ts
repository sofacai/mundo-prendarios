import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { KommoLeadService } from 'src/app/core/services/kommo-lead.service';

@Component({
  selector: 'app-test-cliente',
  templateUrl: './test-cliente.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class TestClienteComponent {
  resultado: any = null;
  error: any = null;

  constructor(private kommoLeadService: KommoLeadService) {}

  crearLeadBasicoDePrueba() {
    const lead = [
      {
        name: "#TestLead - Prueba mínima",
        _embedded: {
          contacts: [{ id: 6613326 }],
          companies: [{ id: 6613332 }]
        }
      }
    ];

    this.kommoLeadService.crearLeadComplejo(lead).subscribe({
      next: res => {
        console.log('✅ Lead creado correctamente:', res);
        this.resultado = res;
        this.error = null;
      },
      error: err => {
        console.error('❌ Error al crear lead:', err);
        this.error = err;
        this.resultado = null;
      }
    });
  }
}
