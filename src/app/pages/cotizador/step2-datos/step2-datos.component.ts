import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CotizadorDataService } from 'src/app/core/services/cotizador-data.service';

@Component({
  selector: 'app-step2-datos',
  templateUrl: './step2-datos.component.html',
  styleUrls: ['./step2-datos.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class Step2DatosComponent implements OnInit {
  @Output() continuar = new EventEmitter<any>();
  @Output() volver = new EventEmitter<void>();

  clienteForm: FormGroup;
  tipoDocumento: 'DNI' | 'CUIL' = 'CUIL'; // Por defecto CUIL

  constructor(
    private fb: FormBuilder,
    public dataService: CotizadorDataService // Inyectamos el servicio
  ) {
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      whatsapp: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      dni: [''],
      cuil: [''],
      sexo: ['']
    });

    // Inicialmente el CUIL es requerido y el DNI no
    this.clienteForm.get('cuil')?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
    this.clienteForm.get('cuil')?.updateValueAndValidity();
  }

  ngOnInit() {
    console.log('Step2DatosComponent inicializado', this);
    console.log('Estado del formulario:', this.clienteForm);
  }

  seleccionarTipoDocumento(tipo: 'DNI' | 'CUIL') {
    this.tipoDocumento = tipo;
    this.updateValidatorsBasedOnDocType();
  }

  // Actualiza los validadores según el tipo de documento seleccionado
  updateValidatorsBasedOnDocType() {
    if (this.tipoDocumento === 'DNI') {
      this.clienteForm.get('dni')?.setValidators([Validators.required, Validators.pattern(/^\d{7,8}$/)]);
      this.clienteForm.get('dni')?.updateValueAndValidity();
      this.clienteForm.get('sexo')?.setValidators([Validators.required]);
      this.clienteForm.get('sexo')?.updateValueAndValidity();

      this.clienteForm.get('cuil')?.clearValidators();
      this.clienteForm.get('cuil')?.setValue(''); // Limpiar CUIL al cambiar a DNI
      this.clienteForm.get('cuil')?.updateValueAndValidity();
    } else {
      this.clienteForm.get('cuil')?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
      this.clienteForm.get('cuil')?.updateValueAndValidity();

      this.clienteForm.get('dni')?.clearValidators();
      this.clienteForm.get('dni')?.setValue(''); // Limpiar DNI al cambiar a CUIL
      this.clienteForm.get('dni')?.updateValueAndValidity();

      this.clienteForm.get('sexo')?.clearValidators();
      this.clienteForm.get('sexo')?.setValue(''); // Limpiar sexo al cambiar a CUIL
      this.clienteForm.get('sexo')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (this.clienteForm.valid) {
      console.log('Formulario válido:', this.clienteForm.value);

      // Preparar los datos a enviar asegurando que DNI y CUIL sean strings
      const datos: any = {
        nombre: this.clienteForm.get('nombre')?.value,
        apellido: this.clienteForm.get('apellido')?.value,
        whatsapp: this.clienteForm.get('whatsapp')?.value,
        telefono: this.clienteForm.get('whatsapp')?.value,
        email: this.clienteForm.get('email')?.value,
        dni: (this.clienteForm.get('dni')?.value || "").toString(),
        cuil: (this.clienteForm.get('cuil')?.value || "").toString(),
        sexo: this.clienteForm.get('sexo')?.value || null
      };

      console.log('Datos a enviar:', datos);
      this.continuar.emit(datos);
    } else {
      // Marcar todos los campos como tocados para mostrar los errores
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onVolver() {
    this.volver.emit();
  }

  // Helpers para validación de formulario
  get nombreInvalido() {
    const control = this.clienteForm.get('nombre');
    return control?.touched && control?.invalid;
  }

  get apellidoInvalido() {
    const control = this.clienteForm.get('apellido');
    return control?.touched && control?.invalid;
  }

  get whatsappInvalido() {
    const control = this.clienteForm.get('whatsapp');
    return control?.touched && control?.invalid;
  }

  get emailInvalido() {
    const control = this.clienteForm.get('email');
    return control?.touched && control?.invalid;
  }

  get dniInvalido() {
    const control = this.clienteForm.get('dni');
    return control?.touched && control?.invalid;
  }

  get cuilInvalido() {
    const control = this.clienteForm.get('cuil');
    return control?.touched && control?.invalid;
  }

  get sexoInvalido() {
    const control = this.clienteForm.get('sexo');
    return control?.touched && control?.invalid;
  }
}
