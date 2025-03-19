import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CanalService, Canal, CanalCrearDto } from 'src/app/core/services/canal.service';
import { PlanService } from 'src/app/core/services/plan.service';

// Define la interfaz de tipos de canal con id y nombre
interface TipoCanal {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-modal-editar-canal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modal-editar-canal.component.html',
  styleUrls: ['./modal-editar-canal.component.scss']
})
export class ModalEditarCanalComponent implements OnChanges, OnDestroy, OnInit {
  @Input() isOpen = false;
  @Input() canalId: number | null = null;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() canalActualizado = new EventEmitter<any>();

  canal: Canal | null = null;
  canalForm: FormGroup;
  loading = false;
  error: string | null = null;

  // Planes disponibles y seleccionados
  planes: any[] = [];
  planesDisponibles: any[] = [];
  selectedPlanIds: number[] = [];
  planesToRemove: number[] = []; // IDs de planCanal para eliminar

  // Tipos de canal disponibles actualizados
  tiposCanal: TipoCanal[] = [
    { id: 1, nombre: 'Concesionario' },
    { id: 2, nombre: 'Multimarca' },
    { id: 3, nombre: 'Agencia' },
    { id: 4, nombre: 'Habitualista' },
    { id: 5, nombre: 'Freelance' },
    { id: 6, nombre: 'Consumidor Final' }
  ];

  constructor(
    private fb: FormBuilder,
    private canalService: CanalService,
    private planService: PlanService,
    private renderer: Renderer2
  ) {
    this.canalForm = this.createForm();
  }

  ngOnInit(): void {
    this.cargarPlanes();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombreFantasia: ['', Validators.required],
      razonSocial: ['', Validators.required],
      provincia: ['', Validators.required],
      localidad: ['', Validators.required],
      cuit: ['', Validators.required],
      cbu: ['', Validators.required],
      alias: ['', Validators.required],
      banco: ['', Validators.required],
      numCuenta: ['', Validators.required],
      tipoCanal: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en isOpen
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.handleModalOpen();
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && !changes['isOpen'].firstChange) {
      this.handleModalClose();
    }

    // Cargar datos del canal cuando cambia el ID
    if (changes['canalId'] && changes['canalId'].currentValue && this.isOpen) {
      this.cargarCanal(changes['canalId'].currentValue);
    }
  }

  handleModalOpen() {
    // Si tenemos un ID de canal, cargamos sus datos
    if (this.canalId) {
      this.cargarCanal(this.canalId);
    }

    // Calculamos el ancho de la barra de desplazamiento
    const scrollWidth = window.innerWidth - document.documentElement.clientWidth;

    // Añadir clase al body cuando se abre el modal
    this.renderer.addClass(document.body, 'modal-open');

    // Establece un padding-right al body para compensar la barra de desplazamiento
    this.renderer.setStyle(document.body, 'padding-right', `${scrollWidth}px`);
    console.log('Modal de edición del canal abierto');
  }

  handleModalClose() {
    // Remover clase y estilos cuando se cierra el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    console.log('Modal de edición del canal cerrado');
  }

  ngOnDestroy(): void {
    // Asegurarse de remover la clase cuando el componente se destruye
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  cargarPlanes(): void {
    this.planService.getPlanesActivos().subscribe({
      next: (planes) => {
        this.planes = planes;

        // Si tenemos un canal, actualizamos los planes disponibles
        if (this.canal) {
          this.actualizarPlanesDisponibles();
        }
      },
      error: (err) => {
        console.error('Error cargando planes:', err);
      }
    });
  }

  cargarCanal(id: number) {
    this.loading = true;
    this.selectedPlanIds = [];
    this.planesToRemove = [];

    this.canalService.getCanalDetalles(id).subscribe({
      next: (canal) => {
        this.canal = canal;

        // Encuentra el id del tipo de canal basado en el nombre
        const tipoId = this.obtenerTipoCanalId(canal.tipoCanal);

        this.canalForm.patchValue({
          nombreFantasia: canal.nombreFantasia,
          razonSocial: canal.razonSocial,
          provincia: canal.provincia,
          localidad: canal.localidad,
          cuit: canal.cuit,
          cbu: canal.cbu,
          alias: canal.alias,
          banco: canal.banco,
          numCuenta: canal.numCuenta,
          tipoCanal: tipoId.toString(), // Usamos el ID como string para el select
          activo: canal.activo
        });

        // Actualizar los planes disponibles
        this.actualizarPlanesDisponibles();

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del canal.';
        console.error('Error cargando canal:', err);
        this.loading = false;
      }
    });
  }

  // Actualizar la lista de planes disponibles (excluyendo los ya asignados)
  actualizarPlanesDisponibles(): void {
    if (!this.canal || !this.planes.length) return;

    // Crear un conjunto con los IDs de planes ya asignados
    const planesAsignados = new Set(this.canal.planesCanal.map(pc => pc.plan.id));

    // Filtrar planes disponibles (solo aquellos que no están ya asignados)
    this.planesDisponibles = this.planes.filter(plan => !planesAsignados.has(plan.id));
  }

  // Método para obtener el ID del tipo de canal basado en su nombre
  obtenerTipoCanalId(nombreTipoCanal: string): number {
    const tipo = this.tiposCanal.find(t => t.nombre === nombreTipoCanal);
    return tipo ? tipo.id : 1; // Por defecto retorna 1 si no encuentra coincidencia
  }

  // Verificar si un plan está seleccionado
  isPlanSelected(planId: number): boolean {
    return this.selectedPlanIds.includes(planId);
  }

  // Alternar la selección de un plan
  togglePlanSelection(planId: number): void {
    if (this.isPlanSelected(planId)) {
      this.selectedPlanIds = this.selectedPlanIds.filter(id => id !== planId);
    } else {
      this.selectedPlanIds.push(planId);
    }
  }

  // Alternar la eliminación de un plan ya asignado
  togglePlanRemoval(planCanalId: number): void {
    if (this.planesToRemove.includes(planCanalId)) {
      this.planesToRemove = this.planesToRemove.filter(id => id !== planCanalId);
    } else {
      this.planesToRemove.push(planCanalId);
    }
  }

  // Recargar datos del canal
  recargarCanal(): void {
    if (!this.canal) return;

    this.canalService.getCanalDetalles(this.canal.id).subscribe({
      next: (canal) => {
        this.canal = canal;
        this.actualizarPlanesDisponibles();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al recargar los datos del canal.';
        console.error('Error recargando canal:', err);
        this.loading = false;
      }
    });
  }

  // Devuelve la clase CSS según el estado
  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }

  cerrarModal() {
    // Limpiar form y errores
    this.canalForm.reset();
    this.error = null;
    this.canal = null;
    this.selectedPlanIds = [];
    this.planesToRemove = [];

    // Remover clase del body al cerrar el modal
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');

    // Notificar al componente padre
    this.closeModal.emit(true);
  }

  async actualizarCanal() {
    if (this.canalForm.invalid || !this.canal) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.canalForm.controls).forEach(key => {
        this.canalForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    // Obtenemos los valores del formulario
    const formValues = this.canalForm.value;

    // Encontrar el nombre del tipo de canal seleccionado
    const tipoSeleccionado = this.tiposCanal.find(tipo => tipo.id.toString() === formValues.tipoCanal);

    // Crear el DTO para enviar al servidor
    const canalDto: CanalCrearDto = {
      nombreFantasia: formValues.nombreFantasia,
      razonSocial: formValues.razonSocial,
      provincia: formValues.provincia,
      localidad: formValues.localidad,
      cuit: formValues.cuit,
      cbu: formValues.cbu,
      alias: formValues.alias,
      banco: formValues.banco,
      numCuenta: formValues.numCuenta,
      tipoCanal: tipoSeleccionado ? tipoSeleccionado.nombre : '',
      activo: formValues.activo
    };

    try {
      // 1. Actualizar el canal
      const canalActualizado = await this.canalService.updateCanal(this.canal.id, canalDto).toPromise();

      // 2. Eliminar planes marcados para remover
      if (this.planesToRemove.length > 0) {
        await Promise.all(
          this.planesToRemove.map(planCanalId =>
            this.canalService.eliminarPlanCanal(planCanalId).toPromise()
          )
        );
      }

      // 3. Asignar nuevos planes seleccionados
      if (this.selectedPlanIds.length > 0) {
        await Promise.all(
          this.selectedPlanIds.map(planId =>
            this.canalService.asignarPlanACanal(this.canal!.id, planId).toPromise()
          )
        );
      }

      // 4. Recargar el canal con todos los cambios
      const canalFinal = await this.canalService.getCanalDetalles(this.canal.id).toPromise();

      this.loading = false;
      this.canalActualizado.emit(canalFinal);
      this.cerrarModal();

    } catch (err) {
      this.loading = false;
      this.error = 'Error al actualizar el canal o sus planes. Intente nuevamente.';
      console.error('Error en la actualización:', err);
    }
  }
}
