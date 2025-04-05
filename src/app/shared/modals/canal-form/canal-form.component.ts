import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CanalService, CanalCrearDto } from 'src/app/core/services/canal.service';
import { PlanService } from 'src/app/core/services/plan.service';
import { UbicacionService, Provincia, Localidad } from 'src/app/core/services/ubicacion.service';

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
  @ViewChild('fileInput') fileInput!: ElementRef;

  canalForm: FormGroup;
  loading = false;
  error: string | null = null;
  imageError: string | null = null;
  imagePreview: string | null = null;
  imageFile: File | null = null;

  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  provinciaSeleccionada: string | null = null;

  esTransferencia = false;

  tiposCanal: TipoCanal[] = [
    { id: 1, nombre: 'Concesionario' },
    { id: 2, nombre: 'Multimarca' },
    { id: 3, nombre: 'Agencia' },
    { id: 4, nombre: 'Habitualista' },
    { id: 5, nombre: 'Freelance' },
    { id: 6, nombre: 'Consumidor Final' }
  ];

  planes: any[] = [];
  selectedPlanIds: number[] = [];

  // Prefijos para formato de teléfono
  private readonly phonePrefix = '+54 9 ';

  constructor(
    private fb: FormBuilder,
    private canalService: CanalService,
    private planService: PlanService,
    private ubicacionService: UbicacionService,
    private renderer: Renderer2
  ) {
    this.canalForm = this.createForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombreFantasia: ['', Validators.required],
      razonSocial: ['', Validators.required],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      cuit: ['', Validators.required],
      tipoCanal: ['', Validators.required],
      activo: [true],
      metodoCobro: ['', Validators.required],
      cbu: [''],
      alias: [''],
      banco: [''],
      numCuenta: [''],
      direccion: [''],
      opcionesCobro: [''],
      titularNombreCompleto: [''],
      titularTelefono: [''],
      titularEmail: ['']
    });
  }

  ngOnInit(): void {
    this.cargarPlanes();
    this.cargarProvincias();

    this.canalForm.get('metodoCobro')?.valueChanges.subscribe(value => {
      this.onMetodoCobroChange();
    });
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
      this.canalForm.get('localidad')?.setValue('');
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

  onMetodoCobroChange(): void {
    const metodoCobro = this.canalForm.get('metodoCobro')?.value;

    const camposBancarios = ['banco', 'cbu', 'numCuenta', 'alias'];
    camposBancarios.forEach(campo => {
      this.canalForm.get(campo)?.clearValidators();
      this.canalForm.get(campo)?.updateValueAndValidity();
    });

    if (metodoCobro === 'transferencia') {
      this.esTransferencia = true;
      this.canalForm.get('banco')?.setValidators([Validators.required]);
      this.canalForm.get('cbu')?.setValidators([Validators.required]);
    } else {
      this.esTransferencia = false;
    }

    camposBancarios.forEach(campo => {
      this.canalForm.get(campo)?.updateValueAndValidity();
    });
  }

  cargarPlanes(): void {
    this.planService.getPlanesActivos().subscribe({
      next: (planes) => {
        this.planes = planes;
      },
      error: () => {
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
      tipoCanal: '',
      provincia: '',
      localidad: '',
      metodoCobro: ''
    });
    this.selectedPlanIds = [];
    this.error = null;
    this.imageError = null;
    this.imagePreview = null;
    this.imageFile = null;
    this.esTransferencia = false;
    this.provinciaSeleccionada = null;
    this.localidades = [];
  }

  // Formatear CUIT mientras se escribe
  onCuitInput(event: any) {
    let value = event.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = '';

    if (value.length <= 2) {
      formatted = value;
    } else if (value.length <= 10) {
      formatted = `${value.slice(0, 2)}-${value.slice(2)}`;
    } else {
      formatted = `${value.slice(0, 2)}-${value.slice(2, 10)}-${value.slice(10)}`;
    }

    event.target.value = formatted;
    this.canalForm.get('cuit')?.setValue(formatted, { emitEvent: false });
  }

  // Formatear teléfono mientras se escribe
  onTelefonoInput(event: any) {
    let value = event.target.value;

    // Asegurar que comience con el prefijo
    if (!value.startsWith(this.phonePrefix)) {
      const cursorPos = event.target.selectionStart;
      const deletedChars = this.phonePrefix.length -
        this.phonePrefix.split('').filter((char: string, i: number) => value.length > i && value[i] === char).length;

      value = this.phonePrefix + value.replace(new RegExp(`^.{0,${this.phonePrefix.length}}`), '');
      this.canalForm.get('titularTelefono')?.setValue(value);

      setTimeout(() => {
        const newPosition = Math.max(this.phonePrefix.length, cursorPos - deletedChars);
        event.target.selectionStart = event.target.selectionEnd = newPosition;
      });
      return;
    }

    // Formatear los números después del prefijo
    const numbers = value.slice(this.phonePrefix.length).replace(/\D/g, '');
    if (numbers.length > 0) {
      let formatted = this.phonePrefix;

      if (numbers.length <= 2) {
        formatted += numbers;
      } else if (numbers.length <= 6) {
        formatted += numbers.substring(0, 2) + ' ' + numbers.substring(2);
      } else {
        formatted += numbers.substring(0, 2) + ' ' +
                   numbers.substring(2, 6) + ' ' +
                   numbers.substring(6, 10);
      }

      if (formatted !== value) {
        const cursorPos = event.target.selectionStart;
        const addedChars = formatted.length - value.length;
        this.canalForm.get('titularTelefono')?.setValue(formatted);

        setTimeout(() => {
          event.target.selectionStart = event.target.selectionEnd = cursorPos + addedChars;
        });
      }
    }
  }

  onTelefonoFocus(event: any) {
    if (!event.target.value) {
      this.canalForm.get('titularTelefono')?.setValue(this.phonePrefix);
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = this.phonePrefix.length;
      });
    } else if (event.target.value === this.phonePrefix) {
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = this.phonePrefix.length;
      });
    }
  }

  onTelefonoBlur(event: any) {
    const value = event.target.value;
    if (value === this.phonePrefix) {
      this.canalForm.get('titularTelefono')?.setValue('');
    }
  }

  // Métodos para manejo de imágenes
  onDragOver(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    this.renderer.addClass(target, 'drag-over');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    this.renderer.removeClass(target, 'drag-over');

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processFile(file);
    }
  }

  processFile(file: File): void {
    this.imageError = null;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.imageError = 'Solo se permiten archivos JPG o PNG';
      return;
    }

    const maxSize = 500 * 1024; // 500KB en bytes
    if (file.size > maxSize) {
      this.imageError = 'La imagen no debe superar los 500KB';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    this.imageFile = file;
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.imagePreview = null;
    this.imageFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async uploadImage(): Promise<string | null> {
    if (!this.imageFile) return null;

    try {
      const timestamp = new Date().getTime();
      const extension = this.imageFile.name.split('.').pop();
      const fileName = `canal_${timestamp}.${extension}`;
      const imageUrl = `assets/canales/profiles/${fileName}`;
      return imageUrl;
    } catch (error) {
      this.error = 'No se pudo procesar la imagen. Intente nuevamente.';
      return null;
    }
  }

  async guardarCanal() {
    if (this.canalForm.invalid) {
      Object.keys(this.canalForm.controls).forEach(key => {
        this.canalForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    let imageUrl = null;

    if (this.imageFile) {
      imageUrl = await this.uploadImage();
      if (this.error) {
        this.loading = false;
        return;
      }
    }

    const formValues = this.canalForm.value;
    const tipoSeleccionado = this.tiposCanal.find(tipo => tipo.id.toString() === formValues.tipoCanal);

    const provinciaSeleccionada = this.provincias.find(p => p.id === formValues.provincia);
    const localidadSeleccionada = this.localidades.find(l => l.id === formValues.localidad);

    // Limpiar el cuit de guiones
    const cuitLimpio = formValues.cuit.replace(/\D/g, '');

    // Para el teléfono, mantener el prefijo pero quitar espacios
    let titularTelefono = formValues.titularTelefono || '';
    if (titularTelefono) {
      // Solo reemplazar espacios, mantener el prefijo y números
      titularTelefono = titularTelefono.replace(/\s/g, '');
    }

    const canalDto: CanalCrearDto = {
      nombreFantasia: formValues.nombreFantasia,
      razonSocial: formValues.razonSocial,
      provincia: provinciaSeleccionada ? provinciaSeleccionada.nombre : '',
      localidad: localidadSeleccionada ? localidadSeleccionada.nombre : '',
      cuit: cuitLimpio,
      tipoCanal: tipoSeleccionado ? tipoSeleccionado.nombre : '',
      activo: true,
      direccion: formValues.direccion || '',
      opcionesCobro: formValues.metodoCobro || '',
      foto: imageUrl || '',
      titularNombreCompleto: formValues.titularNombreCompleto || '',
      titularTelefono: titularTelefono,
      titularEmail: formValues.titularEmail || '',
      cbu: this.esTransferencia ? formValues.cbu : '',
      banco: this.esTransferencia ? formValues.banco : '',
      alias: this.esTransferencia ? (formValues.alias || '') : '',
      numCuenta: this.esTransferencia ? (formValues.numCuenta || '') : ''
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
                error: () => {
                  this.loading = false;
                  this.canalCreado.emit(canal);
                  this.cerrarModal();
                }
              });
            })
            .catch(() => {
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
      error: () => {
        this.loading = false;
        this.error = 'Error al crear el canal. Intente nuevamente.';
      }
    });
  }
}
