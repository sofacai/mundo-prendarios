import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CanalService, CanalCrearDto } from 'src/app/core/services/canal.service';
import { PlanService } from 'src/app/core/services/plan.service';

// Define la interfaz de tipos de canal con id y nombre
interface TipoCanal {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-canal-form',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './canal-form.component.html',
  styleUrls: ['./canal-form.component.scss']
})
export class CanalFormComponent implements OnChanges, OnDestroy, OnInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() canalCreado = new EventEmitter<any>();

  canalForm: FormGroup;
  loading = false;
  error: string | null = null;

  // Tipos de canal disponibles
  tiposCanal: TipoCanal[] = [
    { id: 1, nombre: 'Concesionario' },
    { id: 2, nombre: 'Multimarca' },
    { id: 3, nombre: 'Agencia' },
    { id: 4, nombre: 'Habitualista' },
    { id: 5, nombre: 'Freelance' },
    { id: 6, nombre: 'Consumidor Final' }
  ];

  // Planes disponibles y seleccionados
  planes: any[] = [];
  selectedPlanIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private canalService: CanalService,
    private planService: PlanService,
    private renderer: Renderer2
  ) {
    this.canalForm = this.fb.group({
      nombreFantasia: ['', Validators.required],
      razonSocial: ['', Validators.required],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      cuit: ['', Validators.required],
      cbu: ['', Validators.required],
      alias: [''],
      banco: ['', Validators.required],
      numCuenta: [''],
      tipoCanal: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarPlanes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.resetForm();
        const scrollWidth = window.innerWidth - document.documentElement.clientWidth;
        this.renderer.addClass(document.body, 'modal-open');
        this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
      } else if (!changes['isOpen'].firstChange) {
        this.renderer.removeClass(document.body, 'modal-open');
        this.renderer.removeStyle(document.body, 'padding-right');
      }
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarPlanes(): void {
    this.planService.getPlanesActivos().subscribe({
      next: (planes) => {
        this.planes = planes;
      },
      error: (err) => {
        console.error('Error cargando planes:', err);
        this.error = 'Error al cargar los planes disponibles.';
      }
    });
  }

  isPlanSelected(planId: number): boolean {
    return this.selectedPlanIds.includes(planId);
  }

  togglePlanSelection(planId: number): void {
    if (this.isPlanSelected(planId)) {
      this.selectedPlanIds = this.selectedPlanIds.filter(id => id !== planId);
    } else {
      this.selectedPlanIds.push(planId);
    }
  }

  cerrarModal() {
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    this.closeModal.emit(true);
  }

  resetForm() {
    this.canalForm.reset({
      activo: true,
      tipoCanal: ''
    });
    this.selectedPlanIds = [];
    this.error = null;
  }

  guardarCanal() {
    if (this.canalForm.invalid) {
      Object.keys(this.canalForm.controls).forEach(key => {
        this.canalForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValues = this.canalForm.value;
    const tipoSeleccionado = this.tiposCanal.find(tipo => tipo.id.toString() === formValues.tipoCanal);

    const canalDto: CanalCrearDto = {
      nombreFantasia: formValues.nombreFantasia,
      razonSocial: formValues.razonSocial,
      provincia: formValues.provincia,
      localidad: formValues.localidad,
      cuit: formValues.cuit,
      cbu: formValues.cbu,
      alias: formValues.alias || '',
      banco: formValues.banco,
      numCuenta: formValues.numCuenta || '',
      tipoCanal: tipoSeleccionado ? tipoSeleccionado.nombre : '',
      activo: true
    };

    this.canalService.createCanal(canalDto).subscribe({
      next: (canal) => {
        if (this.selectedPlanIds.length > 0) {
          const asignacionesPromises = this.selectedPlanIds.map(planId =>
            this.canalService.asignarPlanACanal(canal.id, planId).toPromise()
          );

          Promise.all(asignacionesPromises)
            .then(() => {
              this.canalService.getCanalDetalles(canal.id).subscribe({
                next: (canalActualizado) => {
                  this.loading = false;
                  this.canalCreado.emit(canalActualizado);
                  this.cerrarModal();
                },
                error: (err) => {
                  this.loading = false;
                  this.canalCreado.emit(canal);
                  this.cerrarModal();
                }
              });
            })
            .catch(err => {
              this.loading = false;
              this.error = 'Error al asignar planes al canal.';
              this.canalCreado.emit(canal);
            });
        } else {
          this.loading = false;
          this.canalCreado.emit(canal);
          this.cerrarModal();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al crear el canal. Intente nuevamente.';
        console.error('Error creando canal:', err);
      }
    });
  }
}
