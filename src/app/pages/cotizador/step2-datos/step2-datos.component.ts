import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  @Input() clienteData: any = null;
  @Output() continuar = new EventEmitter<any>();
  @Output() volver = new EventEmitter<void>();

  clienteForm: FormGroup;
  tipoDocumento: 'DNI' | 'CUIL' = 'CUIL';
  private readonly prefix = '+54 9 ';
  private skipValidation = false;

  constructor(
    private fb: FormBuilder,
    public dataService: CotizadorDataService
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
    this.updateValidatorsBasedOnDocType();
    this.cargarDatosGuardados();

    setTimeout(() => {
      const whatsappControl = this.clienteForm.get('whatsapp');
      if (whatsappControl && (!whatsappControl.value || whatsappControl.value === '')) {
        whatsappControl.setValue(this.prefix);
      }
    });
  }

  cargarDatosGuardados() {
    const data = this.clienteData || this.dataService;
    if (data.nombre || data.email) {
      const datosCliente = {
        nombre: data.clienteNombre || data.nombre || '',
        apellido: data.clienteApellido || data.apellido || '',
        whatsapp: data.clienteWhatsapp || data.whatsapp || '',
        email: data.clienteEmail || data.email || '',
        dni: data.clienteDni || data.dni || '',
        cuil: data.clienteCuil || data.cuil || '',
        sexo: data.clienteSexo || data.sexo || ''
      };
      this.populateFormWithData(datosCliente);
    }
  }

  populateFormWithData(data: any) {
    if (data.dni) {
      this.tipoDocumento = 'DNI';
    } else if (data.cuil) {
      this.tipoDocumento = 'CUIL';
    }

    this.skipValidation = true;
    this.updateValidatorsBasedOnDocType(false);
    this.skipValidation = false;

    let whatsapp = data.whatsapp;
    if (whatsapp && !whatsapp.startsWith(this.prefix)) {
      whatsapp = this.formatPhoneNumber(whatsapp);
    }

    this.clienteForm.patchValue({
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      whatsapp: whatsapp || this.prefix,
      email: data.email || '',
      dni: data.dni || '',
      cuil: data.cuil || '',
      sexo: data.sexo || ''
    });
  }

  seleccionarTipoDocumento(tipo: 'DNI' | 'CUIL') {
    const dniValue = this.clienteForm.get('dni')?.value;
    const cuilValue = this.clienteForm.get('cuil')?.value;
    const sexoValue = this.clienteForm.get('sexo')?.value;

    this.tipoDocumento = tipo;
    this.skipValidation = true;
    this.updateValidatorsBasedOnDocType(false);
    this.skipValidation = false;

    this.clienteForm.patchValue({ dni: dniValue, cuil: cuilValue, sexo: sexoValue });
  }

  updateValidatorsBasedOnDocType(clearValues: boolean = true) {
    if (this.tipoDocumento === 'DNI') {
      this.clienteForm.get('dni')?.setValidators([
        Validators.required,
        this.validarDNI.bind(this)
      ]);
      this.clienteForm.get('sexo')?.setValidators([Validators.required]);
      this.clienteForm.get('cuil')?.clearValidators();

      if (clearValues) this.clienteForm.patchValue({ cuil: '' });
    } else {
      this.clienteForm.get('cuil')?.setValidators([
        Validators.required,
        this.validarCUIL.bind(this)
      ]);
      this.clienteForm.get('dni')?.clearValidators();
      this.clienteForm.get('sexo')?.clearValidators();

      if (clearValues) this.clienteForm.patchValue({ dni: '', sexo: '' });
    }

    this.clienteForm.get('dni')?.updateValueAndValidity({ emitEvent: false });
    this.clienteForm.get('cuil')?.updateValueAndValidity({ emitEvent: false });
    this.clienteForm.get('sexo')?.updateValueAndValidity({ emitEvent: false });
  }

  validarDNI(control: any) {
    const limpio = (control.value || '').replace(/\D/g, '');
    return limpio.length >= 7 && limpio.length <= 8 ? null : { dniInvalido: true };
  }

  validarCUIL(control: any) {
    const limpio = (control.value || '').replace(/\D/g, '');
    return limpio.length === 11 ? null : { cuilInvalido: true };
  }

  onDniInput(event: any) {
    let value = event.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = '';

    if (value.length <= 2) {
      formatted = value;
    } else if (value.length <= 5) {
      formatted = `${value.slice(0, value.length - 3)}.${value.slice(-3)}`;
    } else {
      formatted = `${value.slice(0, value.length - 6)}.${value.slice(-6, -3)}.${value.slice(-3)}`;
    }

    event.target.value = formatted;
    this.clienteForm.get('dni')?.setValue(formatted, { emitEvent: false });
  }

  onCuilInput(event: any) {
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
    this.clienteForm.get('cuil')?.setValue(formatted, { emitEvent: false });
  }

  formatPhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 0) return this.prefix;
    let formatted = this.prefix;

    if (digits.length <= 2) {
      formatted += digits;
    } else if (digits.length <= 6) {
      formatted += digits.substring(0, 2) + ' ' + digits.substring(2);
    } else {
      formatted += digits.substring(0, 2) + ' ' +
                  digits.substring(2, 6) + ' ' +
                  digits.substring(6, 10);
    }
    return formatted;
  }

  onWhatsAppFocus(event: any) {
    if (event.target.value === this.prefix) {
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = this.prefix.length;
      });
    }
  }

  onWhatsAppInput(event: any) {
    let value = event.target.value;
    if (!value.startsWith(this.prefix)) {
      const cursorPos = event.target.selectionStart;
      const deletedChars = this.prefix.length -
        this.prefix.split('').filter((char, i) => value.length > i && value[i] === char).length;

      value = this.prefix + value.replace(new RegExp(`^.{0,${this.prefix.length}}`), '');
      this.clienteForm.get('whatsapp')?.setValue(value);

      setTimeout(() => {
        const newPosition = Math.max(this.prefix.length, cursorPos - deletedChars);
        event.target.selectionStart = event.target.selectionEnd = newPosition;
      });
      return;
    }

    const numbers = value.slice(this.prefix.length).replace(/\D/g, '');
    if (numbers.length > 0) {
      let formatted = this.prefix;

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
        this.clienteForm.get('whatsapp')?.setValue(formatted);

        setTimeout(() => {
          event.target.selectionStart = event.target.selectionEnd = cursorPos + addedChars;
        });
      }
    }
  }

  onWhatsAppBlur(event: any) {
    const value = event.target.value;
    const numbers = value.slice(this.prefix.length).replace(/\D/g, '');
    if (numbers.length === 0 && value === this.prefix) {
      this.clienteForm.get('whatsapp')?.setValue('');
    }
  }

  private limpiarFormato(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  onSubmit() {
    if (this.skipValidation) return;

    this.updateValidatorsBasedOnDocType(false);

    const nombreValido = this.clienteForm.get('nombre')?.valid;
    const apellidoValido = this.clienteForm.get('apellido')?.valid;
    const whatsappValido = this.clienteForm.get('whatsapp')?.valid;
    const emailValido = this.clienteForm.get('email')?.valid;

    let documentoValido = false;
    if (this.tipoDocumento === 'DNI') {
      documentoValido = !!this.clienteForm.get('dni')?.valid && !!this.clienteForm.get('sexo')?.valid;
    } else {
      documentoValido = !!this.clienteForm.get('cuil')?.valid;
    }

    const formValido = nombreValido && apellidoValido && whatsappValido && emailValido && documentoValido;

    if (formValido) {
      const formData = { ...this.clienteForm.value };

      if (formData.whatsapp && formData.whatsapp.startsWith(this.prefix)) {
        formData.whatsapp = formData.whatsapp.slice(this.prefix.length).replace(/\D/g, '');
      }

      if (formData.dni) {
        formData.dni = this.limpiarFormato(formData.dni);
      }
      if (formData.cuil) {
        formData.cuil = this.limpiarFormato(formData.cuil);
      }

      if (this.dataService.clienteId) {
        formData.clienteId = this.dataService.clienteId;
      }

      console.log('Formulario válido:', formData);
      this.continuar.emit(formData);
    } else {
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

  get dniInvalido(): boolean {
    const control = this.clienteForm.get('dni');
    return !!(control?.touched && control.errors?.['dniInvalido']);
  }

  get cuilInvalido(): boolean {
    const control = this.clienteForm.get('cuil');
    return !!(control?.touched && control.errors?.['cuilInvalido']);
  }
  get nombreInvalido(): boolean {
    const control = this.clienteForm.get('nombre');
    return !!(control?.touched && control.invalid);
  }

  get apellidoInvalido(): boolean {
    const control = this.clienteForm.get('apellido');
    return !!(control?.touched && control.invalid);
  }

  get whatsappInvalido(): boolean {
    const control = this.clienteForm.get('whatsapp');
    const value = control?.value || '';
    if (!control?.touched) return false;
    if (!value.startsWith(this.prefix)) return true;

    const numbers = value.slice(this.prefix.length).replace(/\D/g, '');
    return numbers.length < 10;
  }

  get emailInvalido(): boolean {
    const control = this.clienteForm.get('email');
    return !!(control?.touched && control.invalid);
  }

  get sexoInvalido(): boolean {
    if (this.tipoDocumento !== 'DNI') return false;
    const control = this.clienteForm.get('sexo');
    return !!(control?.touched && control.invalid);
  }

}
