import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-usuario-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './usuario-password.component.html',
  styleUrls: ['./usuario-password.component.scss']
})
export class UsuarioPasswordComponent {
  @Input() usuarioId!: number;
  @Input() usuarioNombre: string = '';
  @Output() passwordChange = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  passwordForm: FormGroup;
  showPassword: boolean = false;
  submitting: boolean = false;
  error: string | null = null;

  constructor(private fb: FormBuilder) {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      return;
    }

    this.submitting = true;
    this.error = null;

    const password = this.passwordForm.get('password')?.value;
    this.passwordChange.emit(password);
  }

  onCancel() {
    this.cancel.emit();
  }

  setError(message: string) {
    this.error = message;
    this.submitting = false;
  }

  setSuccess() {
    this.submitting = false;
    this.passwordForm.reset();
  }
}
