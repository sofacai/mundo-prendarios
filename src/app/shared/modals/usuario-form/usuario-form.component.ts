import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UsuarioService, UsuarioCrearDto } from 'src/app/core/services/usuario.service';

interface Rol {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss']
})
export class UsuarioFormComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() usuarioCreado = new EventEmitter<any>();

  usuarioForm: FormGroup;
  loading = false;
  error: string | null = null;

  private readonly phonePrefix = '+54 9 ';

  roles: Rol[] = [
    { id: 1, nombre: 'Admin' },
    { id: 4, nombre: 'Oficial Comercial' },
    { id: 2, nombre: 'AdminCanal' },
    { id: 3, nombre: 'Vendor' }
  ];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private renderer: Renderer2
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      password: ['', Validators.required],
      rolId: ['', Validators.required]
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

  cerrarModal() {
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    this.closeModal.emit(true);
  }

  resetForm() {
    this.usuarioForm.reset({
      rolId: '',
      telefono: this.phonePrefix
    });
    this.error = null;
  }

  onTelefonoInput(event: any) {
    let value = event.target.value;

    if (!value.startsWith(this.phonePrefix)) {
      const cursorPos = event.target.selectionStart;
      const deletedChars = this.phonePrefix.length -
        this.phonePrefix.split('').filter((char: string, i: number) => value.length > i && value[i] === char).length;

      value = this.phonePrefix + value.replace(new RegExp(`^.{0,${this.phonePrefix.length}}`), '');
      this.usuarioForm.get('telefono')?.setValue(value);

      setTimeout(() => {
        const newPosition = Math.max(this.phonePrefix.length, cursorPos - deletedChars);
        event.target.selectionStart = event.target.selectionEnd = newPosition;
      });
      return;
    }

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
        this.usuarioForm.get('telefono')?.setValue(formatted);

        setTimeout(() => {
          event.target.selectionStart = event.target.selectionEnd = cursorPos + addedChars;
        });
      }
    }
  }

  onTelefonoFocus(event: any) {
    if (!event.target.value) {
      this.usuarioForm.get('telefono')?.setValue(this.phonePrefix);
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
      this.usuarioForm.get('telefono')?.setValue('');
    }
  }

  guardarUsuario() {
    if (this.usuarioForm.invalid) {
      Object.keys(this.usuarioForm.controls).forEach(key => {
        const control = this.usuarioForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValues = this.usuarioForm.value;

    const usuarioDto: UsuarioCrearDto = {
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      email: formValues.email,
      telefono: formValues.telefono,
      password: formValues.password,
      rolId: parseInt(formValues.rolId, 10)
    };

    this.usuarioService.createUsuario(usuarioDto).subscribe({
      next: (usuario) => {
        this.loading = false;
        this.usuarioCreado.emit(usuario);
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al crear el usuario. Intente nuevamente.';
      }
    });
  }
}
