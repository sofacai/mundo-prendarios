import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Gasto } from 'src/app/core/models/gasto.model';

@Component({
  selector: 'app-gasto-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './gasto-form-modal.component.html',
  styleUrls: ['./gasto-form-modal.component.scss']
})
export class GastoFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingGasto: Gasto | null = null;
  @Input() subcanalId!: number;
  @Input() loadingGasto = false;
  @Input() errorGasto: string | null = null;
  @Input() gastosActualesPorcentaje = 0;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveGasto = new EventEmitter<any>();

  gastoForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.createForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingGasto'] && this.editingGasto) {
      this.updateForm();
    } else if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  createForm(): void {
    this.gastoForm = this.fb.group({
      id: [0],
      nombre: ['', Validators.required],
      porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      subcanalId: [this.subcanalId]
    });
  }

  updateForm(): void {
    if (this.editingGasto) {
      this.gastoForm.patchValue({
        id: this.editingGasto.id,
        nombre: this.editingGasto.nombre,
        porcentaje: this.editingGasto.porcentaje,
        subcanalId: this.subcanalId
      });
    }
  }

  resetForm(): void {
    this.gastoForm.reset({
      id: 0,
      nombre: '',
      porcentaje: 0,
      subcanalId: this.subcanalId
    });
  }

  getTotalGastosConNuevo(): number {
    const nuevoGastoPorcentaje = this.gastoForm.get('porcentaje')?.value || 0;

    // Si estamos editando, restamos el porcentaje original y sumamos el nuevo
    if (this.editingGasto) {
      return this.gastosActualesPorcentaje - this.editingGasto.porcentaje + nuevoGastoPorcentaje;
    }

    // Si es un nuevo gasto, solo sumamos
    return this.gastosActualesPorcentaje + nuevoGastoPorcentaje;
  }

  onSubmit(): void {
    if (this.gastoForm.invalid) {
      this.gastoForm.markAllAsTouched();
      return;
    }

    this.saveGasto.emit(this.gastoForm.value);
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
