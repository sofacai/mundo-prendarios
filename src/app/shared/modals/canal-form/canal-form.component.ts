import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CanalService, CanalCrearDto } from 'src/app/core/services/canal.service';
import { PlanService } from 'src/app/core/services/plan.service';
import { UbicacionService, Provincia, Localidad } from 'src/app/core/services/ubicacion.service';

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
  @ViewChild('fileInput') fileInput!: ElementRef;

  canalForm: FormGroup;
  loading = false;
  error: string | null = null;
  imageError: string | null = null;
  imagePreview: string | null = null;
  imageFile: File | null = null;

  // Provincias y localidades
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  provinciaSeleccionada: string | null = null;

  // Flag para control de método de cobro
  esTransferencia = false;

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
      // Método de cobro
      metodoCobro: ['', Validators.required],
      // Campos bancarios (requeridos condicionalmente)
      cbu: [''],
      alias: [''],
      banco: [''],
      numCuenta: [''],
      // Otros campos
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

    // Observar cambios en el método de cobro
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
      error: (err) => {
        console.error('Error cargando provincias:', err);
        this.error = 'Error al cargar las provincias.';
      }
    });
  }

  onProvinciaChange(event: Event): void {
    const provinciaId = (event.target as HTMLSelectElement).value;

    if (provinciaId) {
      this.provinciaSeleccionada = provinciaId;
      this.canalForm.get('localidad')?.setValue('');

      // Cargar localidades para esta provincia
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
      error: (err) => {
        console.error('Error cargando localidades:', err);
        this.error = 'Error al cargar las localidades.';
      }
    });
  }

  onMetodoCobroChange(): void {
    const metodoCobro = this.canalForm.get('metodoCobro')?.value;

    // Resetear validadores para campos bancarios
    const camposBancarios = ['banco', 'cbu', 'numCuenta', 'alias'];
    camposBancarios.forEach(campo => {
      this.canalForm.get(campo)?.clearValidators();
      this.canalForm.get(campo)?.updateValueAndValidity();
    });

    // Si es transferencia, aplicar validadores
    if (metodoCobro === 'transferencia') {
      this.esTransferencia = true;
      this.canalForm.get('banco')?.setValidators([Validators.required]);
      this.canalForm.get('cbu')?.setValidators([Validators.required]);
    } else {
      this.esTransferencia = false;
    }

    // Actualizar validación
    camposBancarios.forEach(campo => {
      this.canalForm.get(campo)?.updateValueAndValidity();
    });
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

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.imageError = 'Solo se permiten archivos JPG o PNG';
      return;
    }

    // Validar tamaño (max 500KB)
    const maxSize = 500 * 1024; // 500KB en bytes
    if (file.size > maxSize) {
      this.imageError = 'La imagen no debe superar los 500KB';
      return;
    }

    // Leer y mostrar la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Guardar archivo para subirlo después
    this.imageFile = file;
  }

  removeImage(event: Event): void {
    event.stopPropagation(); // Evitar que se active el selector de archivos
    this.imagePreview = null;
    this.imageFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  async uploadImage(): Promise<string | null> {
    if (!this.imageFile) return null;

    try {
      // Generar un nombre único para el archivo
      const timestamp = new Date().getTime();
      const extension = this.imageFile.name.split('.').pop();
      const fileName = `canal_${timestamp}.${extension}`;

      // Construir la URL que se usará en la aplicación
      const imageUrl = `assets/canales/profiles/${fileName}`;

      // Aquí normalmente guardarías el archivo en el servidor
      // Como no tenemos esa funcionalidad, solo devolvemos la URL simulada
      console.log('Archivo imagen:', this.imageFile.name);
      console.log('URL generada:', imageUrl);

      return imageUrl;
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
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

    // Si hay imagen, generar URL simulada
    if (this.imageFile) {
      imageUrl = await this.uploadImage();
      if (this.error) {
        this.loading = false;
        return;
      }
    }

    const formValues = this.canalForm.value;
    const tipoSeleccionado = this.tiposCanal.find(tipo => tipo.id.toString() === formValues.tipoCanal);

    // Para provincia y localidad, necesitamos los nombres
    const provinciaSeleccionada = this.provincias.find(p => p.id === formValues.provincia);
    const localidadSeleccionada = this.localidades.find(l => l.id === formValues.localidad);

    // Crear objeto para guardar
    const canalDto: CanalCrearDto = {
      nombreFantasia: formValues.nombreFantasia,
      razonSocial: formValues.razonSocial,
      provincia: provinciaSeleccionada ? provinciaSeleccionada.nombre : '',
      localidad: localidadSeleccionada ? localidadSeleccionada.nombre : '',
      cuit: formValues.cuit,
      tipoCanal: tipoSeleccionado ? tipoSeleccionado.nombre : '',
      activo: true,
      direccion: formValues.direccion || '',
      opcionesCobro: formValues.metodoCobro || '',
      foto: imageUrl || '',  // Usar la URL simulada
      titularNombreCompleto: formValues.titularNombreCompleto || '',
      titularTelefono: formValues.titularTelefono || '',
      titularEmail: formValues.titularEmail || '',
      // Datos bancarios solo si es transferencia
      cbu: this.esTransferencia ? formValues.cbu : '',
      banco: this.esTransferencia ? formValues.banco : '',
      alias: this.esTransferencia ? (formValues.alias || '') : '',
      numCuenta: this.esTransferencia ? (formValues.numCuenta || '') : ''
    };

    // Guardar canal
    this.canalService.createCanal(canalDto).subscribe({
      next: (canal) => {
        // Si hay planes seleccionados, asignarlos
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
