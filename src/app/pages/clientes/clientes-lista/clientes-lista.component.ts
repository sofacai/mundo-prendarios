import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';

// Definición del DTO para cliente (similar al de usuario)
export interface ClienteDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  activo: boolean;
}

@Component({
  selector: 'app-clientes-lista',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    IonicModule,
    // Los componentes de modal se importarán cuando estén creados
  ],
  templateUrl: './clientes-lista.component.html',
  styleUrls: ['./clientes-lista.component.scss']
})
export class ClientesListaComponent implements OnInit {
  clientes: ClienteDto[] = [];
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalEditarOpen = false;
  modalVerOpen = false;
  clienteIdEditar: number | null = null;
  clienteIdVer: number | null = null;
  scrollbarWidth: number = 0;

  constructor(
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.loadClientes();
    // Calcular el ancho de la barra de desplazamiento
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  }

  loadClientes() {
    this.loading = true;

    // Como mencionaste que la base está vacía, vamos a simular datos
    setTimeout(() => {
      this.clientes = [
        {
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan.perez@example.com',
          telefono: '+54 11 1234-5678',
          activo: true
        },
        {
          id: 2,
          nombre: 'María',
          apellido: 'González',
          email: 'maria.gonzalez@example.com',
          telefono: '+54 11 8765-4321',
          activo: true
        },
        {
          id: 3,
          nombre: 'Carlos',
          apellido: 'Rodríguez',
          email: 'carlos.rodriguez@example.com',
          telefono: '+54 11 5555-6666',
          activo: false
        }
      ];
      this.loading = false;
    }, 1000); // Simular delay de red

    // El servicio real se implementará después
    /*
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.error = 'No se pudieron cargar los clientes. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
    */
  }

  // Navegar al detalle del cliente
  verDetalle(id: number): void {
    this.clienteIdVer = id;
    this.modalVerOpen = true;
    this.manejarAperturaModal();
  }



  // Abre el modal para nuevo cliente
  abrirModalNuevoCliente() {
    console.log('Abrir modal para nuevo cliente');
    // Implementación futura
  }

  // Funciones helper para manejar estilos del body
  private manejarAperturaModal() {
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

  private manejarCierreModal() {
    // Solo restaurar si no hay ningún otro modal abierto
    if (!this.modalOpen && !this.modalEditarOpen && !this.modalVerOpen) {
      const contentArea = document.querySelector('.content-area') as HTMLElement;
      if (contentArea) {
        this.renderer.removeClass(contentArea, 'content-area-with-modal');
        this.renderer.removeStyle(document.body, 'position');
        this.renderer.removeStyle(document.body, 'width');
        this.renderer.removeStyle(document.body, 'overflow-y');
      }
    }
  }
}
