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
  private readonly prefix = '+54 9 ';

  constructor(
    private fb: FormBuilder,
    public dataService: CotizadorDataService // Inyectamos el servicio
  ) {
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      whatsapp: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      dni: [''],
      cuil: [''],
      sexo: ['']
    });
  }

  ngOnInit() {
    console.log('Step2DatosComponent inicializado');

    // Inicializar validadores según tipo de documento por defecto
    this.updateValidatorsBasedOnDocType();

    // Inicializar el valor de WhatsApp con el prefijo
    setTimeout(() => {
      this.clienteForm.get('whatsapp')?.setValue(this.prefix);
    });
  }

  seleccionarTipoDocumento(tipo: 'DNI' | 'CUIL') {
    // Guardar valores actuales
    const dniValue = this.clienteForm.get('dni')?.value;
    const cuilValue = this.clienteForm.get('cuil')?.value;
    const sexoValue = this.clienteForm.get('sexo')?.value;

    // Cambiar tipo de documento
    this.tipoDocumento = tipo;

    // Actualizar validadores sin limpiar valores
    this.updateValidatorsBasedOnDocType(false);

    // Restaurar valores
    this.clienteForm.get('dni')?.setValue(dniValue);
    this.clienteForm.get('cuil')?.setValue(cuilValue);
    this.clienteForm.get('sexo')?.setValue(sexoValue);
  }

  // Actualiza los validadores según el tipo de documento seleccionado
  updateValidatorsBasedOnDocType(clearValues: boolean = true) {
    if (this.tipoDocumento === 'DNI') {
      // Añadir validadores a DNI y sexo
      this.clienteForm.get('dni')?.setValidators([Validators.required, Validators.pattern(/^\d{7,8}$/)]);
      this.clienteForm.get('sexo')?.setValidators([Validators.required]);

      // Quitar validadores de CUIL
      this.clienteForm.get('cuil')?.clearValidators();

      if (clearValues) {
        this.clienteForm.get('cuil')?.setValue('');
      }
    } else {
      // Añadir validadores a CUIL
      this.clienteForm.get('cuil')?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);

      // Quitar validadores de DNI y sexo
      this.clienteForm.get('dni')?.clearValidators();
      this.clienteForm.get('sexo')?.clearValidators();

      if (clearValues) {
        this.clienteForm.get('dni')?.setValue('');
        this.clienteForm.get('sexo')?.setValue('');
      }
    }

    // Actualizar estado de validación sin emitir eventos
    this.clienteForm.get('dni')?.updateValueAndValidity({emitEvent: false});
    this.clienteForm.get('cuil')?.updateValueAndValidity({emitEvent: false});
    this.clienteForm.get('sexo')?.updateValueAndValidity({emitEvent: false});
  }

  onWhatsAppFocus(event: any) {
    // Si solo contiene el prefijo, colocar el cursor al final
    if (event.target.value === this.prefix) {
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = this.prefix.length;
      });
    }
  }

  onWhatsAppInput(event: any) {
    let value = event.target.value;
    // Si el usuario intenta eliminar o modificar el prefijo, restaurarlo
    if (!value.startsWith(this.prefix)) {
      const cursorPos = event.target.selectionStart;
      // Determinar si está intentando borrar el prefijo
      const deletedChars = this.prefix.length -
        this.prefix.split('').filter((char, i) => value.length > i && value[i] === char).length;

      // Restaurar el prefijo
      value = this.prefix + value.replace(new RegExp(`^.{0,${this.prefix.length}}`), '');

      // Actualizar el input
      this.clienteForm.get('whatsapp')?.setValue(value);

      // Restaurar la posición del cursor
      setTimeout(() => {
        const newPosition = Math.max(this.prefix.length, cursorPos - deletedChars);
        event.target.selectionStart = event.target.selectionEnd = newPosition;
      });
      return;
    }

    // Formatear números después del prefijo: XX XXXX XXXX
    const numbers = value.slice(this.prefix.length).replace(/\D/g, '');

    if (numbers.length > 0) {
      let formatted = this.prefix;

      // Aplicar formato según la cantidad de dígitos
      if (numbers.length <= 2) {
        formatted += numbers;
      } else if (numbers.length <= 6) {
        formatted += numbers.substring(0, 2) + ' ' + numbers.substring(2);
      } else {
        formatted += numbers.substring(0, 2) + ' ' +
                    numbers.substring(2, 6) + ' ' +
                    numbers.substring(6, 10);
      }

      // Si es diferente, actualizar el valor (preservando la posición del cursor)
      if (formatted !== value) {
        const cursorPos = event.target.selectionStart;
        const addedChars = formatted.length - value.length;

        // Actualizar solo si el formato cambió
        this.clienteForm.get('whatsapp')?.setValue(formatted);

        // Restaurar la posición del cursor
        setTimeout(() => {
          event.target.selectionStart = event.target.selectionEnd = cursorPos + addedChars;
        });
      }
    }
  }

  onWhatsAppBlur(event: any) {
    // Verificar que tenga al menos el prefijo y algunos dígitos
    const value = event.target.value;
    const numbers = value.slice(this.prefix.length).replace(/\D/g, '');

    if (numbers.length === 0 && value === this.prefix) {
      // Si solo tiene el prefijo, limpiarlo para validación
      this.clienteForm.get('whatsapp')?.setValue('');
    }
  }

  onSubmit() {
    // Asegurarse de validar solo los campos relevantes
    this.updateValidatorsBasedOnDocType(false);

    // Verificar campos obligatorios comunes
    const nombreValido = this.clienteForm.get('nombre')?.valid;
    const apellidoValido = this.clienteForm.get('apellido')?.valid;
    const whatsappValido = this.clienteForm.get('whatsapp')?.valid;
    const emailValido = this.clienteForm.get('email')?.valid;

    // Verificar campos específicos según tipo de documento
    let documentoValido = false;
if (this.tipoDocumento === 'DNI') {
  const dniControl = this.clienteForm.get('dni');
  const sexoControl = this.clienteForm.get('sexo');
  documentoValido = (dniControl?.valid === true) && (sexoControl?.valid === true);
} else {
  const cuilControl = this.clienteForm.get('cuil');
  documentoValido = (cuilControl?.valid === true);
}

    // Comprobar si todos los campos necesarios son válidos
    const formValido = nombreValido && apellidoValido && whatsappValido && emailValido && documentoValido;

    if (formValido) {
      const formData = {...this.clienteForm.value};

      // Extraer solo los números del WhatsApp
      if (formData.whatsapp && formData.whatsapp.startsWith(this.prefix)) {
        const cleanNumber = formData.whatsapp
          .slice(this.prefix.length)
          .replace(/\D/g, '');

        // Reemplazar con solo los dígitos
        formData.whatsapp = cleanNumber;
      }

      // Eliminar campos no utilizados según tipo de documento
      if (this.tipoDocumento === 'DNI') {
        delete formData.cuil;
      } else {
        delete formData.dni;
        delete formData.sexo;
      }

      console.log('Formulario válido:', formData);
      this.continuar.emit(formData);
    } else {
      // Marcar solo los campos relevantes como tocados
      this.clienteForm.get('nombre')?.markAsTouched();
      this.clienteForm.get('apellido')?.markAsTouched();
      this.clienteForm.get('whatsapp')?.markAsTouched();
      this.clienteForm.get('email')?.markAsTouched();

      if (this.tipoDocumento === 'DNI') {
        this.clienteForm.get('dni')?.markAsTouched();
        this.clienteForm.get('sexo')?.markAsTouched();
      } else {
        this.clienteForm.get('cuil')?.markAsTouched();
      }
    }
  }

  onVolver() {
    this.volver.emit();
  }

  // Helpers para validación de formulario - Solo muestra errores si el campo está tocado
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
    if (!control?.touched) return false;

    const value = control.value || '';
    if (!value.startsWith(this.prefix)) return true;

    // Verificar que tenga números después del prefijo
    const numbers = value.slice(this.prefix.length).replace(/\D/g, '');
    return numbers.length < 10;
  }

  get emailInvalido() {
    const control = this.clienteForm.get('email');
    return control?.touched && control?.invalid;
  }

  get dniInvalido() {
    const control = this.clienteForm.get('dni');
    return this.tipoDocumento === 'DNI' && control?.touched && control?.invalid;
  }

  get cuilInvalido() {
    const control = this.clienteForm.get('cuil');
    return this.tipoDocumento === 'CUIL' && control?.touched && control?.invalid;
  }

  get sexoInvalido() {
    const control = this.clienteForm.get('sexo');
    return this.tipoDocumento === 'DNI' && control?.touched && control?.invalid;
  }
}
