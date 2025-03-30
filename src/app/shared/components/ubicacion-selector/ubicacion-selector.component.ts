// src/app/shared/components/ubicacion-selector/ubicacion-selector.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UbicacionService, Provincia, Localidad } from 'src/app/core/services/ubicacion.service';

@Component({
  selector: 'app-ubicacion-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="ubicacion-selector">
      <div class="form-group">
        <label>{{ provinciaLabel }}</label>
        <select
          class="form-control"
          [(ngModel)]="selectedProvincia"
          (change)="onProvinciaChange()">
          <option value="">Seleccione una provincia</option>
          <option *ngFor="let prov of provincias" [value]="prov.id">
            {{ prov.nombre }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>{{ localidadLabel }}</label>
        <select
          class="form-control"
          [(ngModel)]="selectedLocalidad"
          (change)="onLocalidadSelect()">
          <option value="">Seleccione una localidad</option>
          <option *ngFor="let loc of localidades" [value]="loc.id">
            {{ loc.nombre }}
          </option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    .ubicacion-selector {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-group {
      position: relative;
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--ion-color-dark);
    }
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #e4e6ef;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }
    .form-control:focus {
      border-color: var(--ion-color-primary);
      outline: none;
      box-shadow: 0 0 0 0.2rem rgba(0, 158, 247, 0.1);
    }
  `]
})
export class UbicacionSelectorComponent implements OnInit {
  @Input() provinciaLabel: string = 'Provincia';
  @Input() localidadLabel: string = 'Localidad';
  @Input() initialProvincia: string = '';
  @Input() initialLocalidad: string = '';

  @Output() provinciaChange = new EventEmitter<{id: string, nombre: string}>();
  @Output() localidadChange = new EventEmitter<{id: string, nombre: string}>();

  provincias: Provincia[] = [];
  localidades: Localidad[] = [];

  selectedProvincia: string = '';
  selectedLocalidad: string = '';
  loading: boolean = false;

  constructor(private ubicacionService: UbicacionService) { }

  ngOnInit() {
    this.loadProvincias();
  }

  loadProvincias() {
    this.loading = true;
    this.ubicacionService.getProvincias().subscribe({
      next: (data) => {
        this.provincias = data;
        this.loading = false;

        // Establecer valores iniciales si existen
        if (this.initialProvincia) {
          // Buscar provincia por nombre
          const provincia = this.provincias.find(p =>
            p.nombre.toLowerCase() === this.initialProvincia.toLowerCase());
          if (provincia) {
            this.selectedProvincia = provincia.id;
            this.onProvinciaChange();
          }
        }
      },
      error: (err) => {
        console.error('Error cargando provincias:', err);
        this.loading = false;
      }
    });
  }

  onProvinciaChange() {
    if (!this.selectedProvincia) {
      this.localidades = [];
      this.selectedLocalidad = '';
      this.provinciaChange.emit({id: '', nombre: ''});
      return;
    }

    this.loading = true;
    this.ubicacionService.getLocalidades(this.selectedProvincia).subscribe({
      next: (data) => {
        this.localidades = data;
        this.loading = false;

        // Emitir la provincia seleccionada
        const provincia = this.provincias.find(p => p.id === this.selectedProvincia);
        if (provincia) {
          this.provinciaChange.emit({id: provincia.id, nombre: provincia.nombre});
        }

        // Buscar la localidad inicial si existe
        if (this.initialLocalidad) {
          const localidad = this.localidades.find(l =>
            l.nombre.toLowerCase() === this.initialLocalidad.toLowerCase());
          if (localidad) {
            this.selectedLocalidad = localidad.id;
            this.onLocalidadSelect();
          }
          this.initialLocalidad = ''; // Limpiar para no volver a buscar
        }
      },
      error: (err) => {
        console.error('Error cargando localidades:', err);
        this.loading = false;
      }
    });
  }

  onLocalidadSelect() {
    if (!this.selectedLocalidad) {
      this.localidadChange.emit({id: '', nombre: ''});
      return;
    }

    const localidad = this.localidades.find(l => l.id === this.selectedLocalidad);
    if (localidad) {
      this.localidadChange.emit({id: localidad.id, nombre: localidad.nombre});
    }
  }
}
