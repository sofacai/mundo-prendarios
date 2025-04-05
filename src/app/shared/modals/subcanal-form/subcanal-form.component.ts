import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SubcanalService, SubcanalCrearDto } from 'src/app/core/services/subcanal.service';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { UbicacionService, Provincia, Localidad } from 'src/app/core/services/ubicacion.service';
import { Gasto, GastoCreate } from 'src/app/core/models/gasto.model';

@Component({
  selector: 'app-subcanal-form',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './subcanal-form.component.html',
  styleUrls: ['./subcanal-form.component.scss']
})
export class SubcanalFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() subcanalCreado = new EventEmitter<any>();

  subcanalForm: FormGroup;
  loading = false;
  error: string | null = null;
  canales: Canal[] = [];
  administradores: UsuarioDto[] = [];

  // Provincias y localidades
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  provinciaSeleccionada: string | null = null;

  constructor(
    private fb: FormBuilder,
    private subcanalService: SubcanalService,
    private canalService: CanalService,
    private usuarioService: UsuarioService,
    private ubicacionService: UbicacionService,
    private renderer: Renderer2
  ) {
    this.subcanalForm = this.createForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      canalId: ['', Validators.required],
      adminCanalId: [''],
      gastoValor: [7, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    this.cargarProvincias();
  }

  cargarProvincias(): void {
    this.ubicacionService.getProvincias().subscribe({
      next: (provincias) => {
        this.provincias = provincias;
      },
      error: () => {
        this.error = 'Error al cargar las provincias.';
      }
    });
  }

  onProvinciaChange(event: Event): void {
    const provinciaId = (event.target as HTMLSelectElement).value;

    if (provinciaId) {
      this.provinciaSeleccionada = provinciaId;
      this.subcanalForm.get('localidad')?.setValue('');
      this.cargarLocalidades(provinciaId);
    } else {
      this.provinciaSeleccionada = null;
      this.localidades = [];
    }
  }

  cargarLocalidades(provinciaId: string): void {
    this.ubicacionService.getLocalidades(provinciaId).subscribe({
      next: (localidades) => {
        this.localidades = localidades;
      },
      error: () => {
        this.error = 'Error al cargar las localidades.';
      }
    });
  }

  cargarCanales() {
    this.canalService.getCanales().subscribe({
      next: (data) => {
        this.canales = data;
      },
      error: () => {
        this.error = 'Error al cargar la lista de canales.';
      }
    });
  }

  cargarAdministradores() {
    this.usuarioService.getUsuariosPorRol(2).subscribe({
      next: (data) => {
        this.administradores = data;
      },
      error: () => {
        this.error = 'Error al cargar la lista de administradores.';
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.resetForm();

        // Cargar datos solo cuando el modal se abre
        this.cargarCanales();
        this.cargarAdministradores();

        // Calculamos el ancho de la barra de desplazamiento
        const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

        // Añadir clase al body cuando se abre el modal
        this.renderer.addClass(document.body, 'modal-open');

        // Establece un padding-right al body para compensar la barra de desplazamiento
        this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
      } else if (!changes['isOpen'].firstChange) {
        // Remover clase y estilos cuando se cierra el modal
        this.renderer.removeClass(document.body, 'modal-open');
        this.renderer.removeStyle(document.body, 'padding-right');
      }
    }
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cerrarModal() {
    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    this.closeModal.emit(true);
  }

  resetForm() {
    this.subcanalForm.reset({
      nombre: '',
      provincia: '',
      localidad: '',
      canalId: '',
      adminCanalId: '',
      gastoValor: 7
    });
    this.provinciaSeleccionada = null;
    this.localidades = [];
    this.error = null;
  }

  guardarSubcanal() {
    if (this.subcanalForm.invalid) {
      Object.keys(this.subcanalForm.controls).forEach(key => {
        const control = this.subcanalForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValues = this.subcanalForm.value;
    const provinciaSeleccionada = this.provincias.find(p => p.id === formValues.provincia);
    const localidadSeleccionada = this.localidades.find(l => l.id === formValues.localidad);

    const subcanalDto: SubcanalCrearDto = {
      nombre: formValues.nombre,
      provincia: provinciaSeleccionada ? provinciaSeleccionada.nombre : '',
      localidad: localidadSeleccionada ? localidadSeleccionada.nombre : '',
      canalId: parseInt(formValues.canalId),
      adminCanalId: formValues.adminCanalId ? parseInt(formValues.adminCanalId) : undefined,
      comision: 0
    };

    this.subcanalService.createSubcanal(subcanalDto).subscribe({
      next: (subcanal) => {
        if (formValues.gastoValor > 0) {
          const gasto: GastoCreate = {
            nombre: 'Gastos Generales',
            porcentaje: formValues.gastoValor,
            subcanalId: subcanal.id
          };

          this.subcanalService.agregarGasto(subcanal.id, gasto).subscribe({
            next: (gastoCreado) => {
              this.loading = false;
              this.subcanalCreado.emit({...subcanal, gastos: [gastoCreado]});
              this.cerrarModal();
            },
            error: () => {
              this.loading = false;
              this.subcanalCreado.emit(subcanal);
              this.cerrarModal();
            }
          });
        } else {
          this.loading = false;
          this.subcanalCreado.emit(subcanal);
          this.cerrarModal();
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al crear el subcanal. Intente nuevamente.';
      }
    });
  }
}
