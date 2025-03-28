import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SubcanalService, SubcanalCrearDto } from 'src/app/core/services/subcanal.service';
import { CanalService, Canal } from 'src/app/core/services/canal.service';
import { UsuarioService, UsuarioDto } from 'src/app/core/services/usuario.service';
import { forkJoin } from 'rxjs';
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

  // Variables para el dropdown personalizado
  dropdownOpen = false;
  selectedAdminText = '';

  constructor(
    private fb: FormBuilder,
    private subcanalService: SubcanalService,
    private canalService: CanalService,
    private usuarioService: UsuarioService,
    private renderer: Renderer2
  ) {
    this.subcanalForm = this.fb.group({
      nombre: ['', Validators.required],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      canalId: ['', Validators.required],
      adminCanalId: ['', Validators.required],
      comision: [0, [Validators.required, Validators.min(0), Validators.max(100)]], // Nuevo campo comisión
      // Campos para el gasto
      gastoNombre: [''],
      gastoPorcentaje: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    // Escuchar cambios en el valor de adminCanalId para actualizar texto del dropdown
    this.subcanalForm.get('adminCanalId')?.valueChanges.subscribe(value => {
      if (value) {
        const admin = this.administradores.find(a => a.id === +value);
        if (admin) {
          this.selectedAdminText = `${admin.nombre} ${admin.apellido}`;
        }
      } else {
        this.selectedAdminText = '';
      }
    });

    // Cerrar dropdown cuando se hace clic fuera
    this.renderer.listen('document', 'click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-select') && this.dropdownOpen) {
        this.dropdownOpen = false;
      }
    });
  }

  cargarCanales() {
    this.canalService.getCanales().subscribe({
      next: (data) => {
        this.canales = data;
      },
      error: (err) => {
        console.error('Error al cargar canales:', err);
        this.error = 'Error al cargar la lista de canales.';
      }
    });
  }

  cargarAdministradores() {
    // Cargamos los usuarios con rol 2 (AdminCanal)
    this.usuarioService.getUsuariosPorRol(2).subscribe({
      next: (data) => {
        this.administradores = data;
        console.log('Administradores cargados:', this.administradores);
      },
      error: (err) => {
        console.error('Error al cargar administradores:', err);
        this.error = 'Error al cargar la lista de administradores.';
      }
    });
  }

  // Métodos para manejar el dropdown personalizado
  toggleDropdown(event: Event) {
    event.stopPropagation(); // Evitar que el evento se propague
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectAdmin(admin: UsuarioDto, event: Event) {
    event.stopPropagation(); // Evitar que el evento se propague
    this.subcanalForm.get('adminCanalId')?.setValue(admin.id);
    this.selectedAdminText = `${admin.nombre} ${admin.apellido}`;
    this.dropdownOpen = false;
  }

  formatAdminLabel(admin: UsuarioDto): string {
    return `${admin.nombre} ${admin.apellido} (${admin.email})`;
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
        console.log('Modal de subcanal abierto:', this.isOpen);
      } else if (!changes['isOpen'].firstChange) {
        // Remover clase y estilos cuando se cierra el modal
        this.renderer.removeClass(document.body, 'modal-open');
        this.renderer.removeStyle(document.body, 'padding-right');
        console.log('Modal de subcanal cerrado');
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
      comision: 0, // Valor por defecto para comisión
      gastoNombre: '',
      gastoPorcentaje: 0
    });
    this.selectedAdminText = '';
    this.error = null;
  }

  guardarSubcanal() {
    if (this.subcanalForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.subcanalForm.controls).forEach(key => {
        const control = this.subcanalForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    // Obtener los valores del formulario
    const formValues = this.subcanalForm.value;

    // Crear el DTO con los valores del formulario
    const subcanalDto: SubcanalCrearDto = {
      nombre: formValues.nombre,
      provincia: formValues.provincia,
      localidad: formValues.localidad,
      canalId: parseInt(formValues.canalId),
      adminCanalId: parseInt(formValues.adminCanalId),
      comision: formValues.comision // Enviamos el valor de comisión
    };

    this.subcanalService.createSubcanal(subcanalDto).subscribe({
      next: (subcanal) => {
        // Verificar si se ha ingresado un gasto para agregarlo
        if (formValues.gastoNombre && formValues.gastoPorcentaje > 0) {
          const gasto: GastoCreate = {
            nombre: formValues.gastoNombre,
            porcentaje: formValues.gastoPorcentaje,
            subcanalId: subcanal.id
          };

          // Agregar el gasto al subcanal
          this.subcanalService.agregarGasto(subcanal.id, gasto).subscribe({
            next: (gastoCreado) => {
              console.log('Gasto agregado correctamente:', gastoCreado);
              this.loading = false;
              this.subcanalCreado.emit({...subcanal, gastos: [gastoCreado]});
              this.cerrarModal();
            },
            error: (err) => {
              console.error('Error al agregar el gasto:', err);
              // Aún así, emitimos que el subcanal se creó correctamente
              this.loading = false;
              this.subcanalCreado.emit(subcanal);
              this.cerrarModal();
            }
          });
        } else {
          // Si no hay gasto, simplemente cerramos
          this.loading = false;
          this.subcanalCreado.emit(subcanal);
          this.cerrarModal();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al crear el subcanal. Intente nuevamente.';
        console.error('Error creando subcanal:', err);
      }
    });
  }
}
