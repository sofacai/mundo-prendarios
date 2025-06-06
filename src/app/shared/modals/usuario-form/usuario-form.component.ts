// usuario-form.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UsuarioService, UsuarioCrearDto } from 'src/app/core/services/usuario.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { RolType } from 'src/app/core/models/usuario.model';
import { SubcanalService, Subcanal } from 'src/app/core/services/subcanal.service';
import { forkJoin } from 'rxjs';

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
export class UsuarioFormComponent implements OnChanges, OnDestroy, OnInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() usuarioCreado = new EventEmitter<any>();
  @Input() rolIdPredeterminado?: number;

  usuarioForm: FormGroup;
  loading = false;
  error: string | null = null;
  creadorId: number;
  showSubcanalField = false;
  subcanales: Subcanal[] = [];
  loadingSubcanales = false;

  private readonly phonePrefix = '+54 9 ';

  allRoles: Rol[] = [
    { id: 1, nombre: 'Admin' },
    { id: 4, nombre: 'Oficial Comercial' },
    { id: 2, nombre: 'AdminCanal' },
    { id: 3, nombre: 'Vendor' }
  ];

  roles: Rol[] = [];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private renderer: Renderer2,
    private subcanalService: SubcanalService
  ) {
    this.creadorId = this.usuarioService.getLoggedInUserId();

    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, this.telefonoValidator.bind(this)]],
      password: ['', Validators.required],
      rolId: ['', Validators.required],
      subcanalId: ['']
    });

    // Escuchar cambios en rolId para mostrar/ocultar campo de subcanal
    this.usuarioForm.get('rolId')?.valueChanges.subscribe(rolId => {
      if (parseInt(rolId) === RolType.Vendor) {
        this.showSubcanalField = true;
        this.usuarioForm.get('subcanalId')?.setValidators(Validators.required);
        this.cargarSubcanales();
      } else {
        this.showSubcanalField = false;
        this.usuarioForm.get('subcanalId')?.clearValidators();
      }
      this.usuarioForm.get('subcanalId')?.updateValueAndValidity();
    });
  }

  telefonoValidator(control: any) {
    if (!control.value) return null;

    // Eliminar prefijo y espacios para contar solo dígitos
    const value = control.value.replace(this.phonePrefix, '').replace(/\s/g, '');
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length !== 10) {
      return { invalidLength: true };
    }

    return null;
  }

  ngOnInit(): void {
    this.filterRolesByUserPermission();

    // Si hay un rol predeterminado
    if (this.rolIdPredeterminado) {
      // Filtrar sólo este rol
      this.roles = this.allRoles.filter(rol => rol.id === this.rolIdPredeterminado);

      // Establecer el valor en el formulario como número, no como string
      this.usuarioForm.get('rolId')?.setValue(this.rolIdPredeterminado);

      // Asegurarse de que el campo esté deshabilitado si solo hay una opción
      if (this.roles.length === 1) {
        this.usuarioForm.get('rolId')?.disable();
      }

      // Si el rol predeterminado es Vendor, mostrar campo de subcanal
      if (this.rolIdPredeterminado === RolType.Vendor) {
        this.showSubcanalField = true;
        this.usuarioForm.get('subcanalId')?.setValidators(Validators.required);
        this.cargarSubcanales();
      }
    }
  }

  cargarSubcanales() {
    this.loadingSubcanales = true;
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      this.loadingSubcanales = false;
      return;
    }

    // Dependiendo del rol, cargar los subcanales apropiados
    if (currentUser.rolId === RolType.AdminCanal) {
      // Admin Canal solo ve sus subcanales
      this.subcanalService.getSubcanalesPorUsuario(currentUser.id).subscribe({
        next: (subcanales) => {
          this.subcanales = subcanales.filter(s => s.activo);
          this.loadingSubcanales = false;
        },
        error: (err) => {
          console.error('Error cargando subcanales:', err);
          this.loadingSubcanales = false;
        }
      });
    } else if (currentUser.rolId === RolType.OficialComercial || currentUser.rolId === RolType.Administrador) {
      // Oficial Comercial ve todos los subcanales activos
      this.subcanalService.getSubcanales().subscribe({
        next: (subcanales) => {
          this.subcanales = subcanales.filter(s => s.activo);
          this.loadingSubcanales = false;
        },
        error: (err) => {
          console.error('Error cargando subcanales:', err);
          this.loadingSubcanales = false;
        }
      });
    } else {
      this.loadingSubcanales = false;
    }
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

  filterRolesByUserPermission(): void {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      this.roles = [];
      return;
    }

    switch(currentUser.rolId) {
      case RolType.Administrador:
        // Administrador puede crear cualquier rol
        this.roles = [...this.allRoles];
        break;

      case RolType.OficialComercial:
        // Oficial Comercial puede crear AdminCanal y Vendor
        this.roles = this.allRoles.filter(rol =>
          rol.id === RolType.AdminCanal || rol.id === RolType.Vendor
        );
        break;

      case RolType.AdminCanal:
        // AdminCanal solo puede crear Vendor
        this.roles = this.allRoles.filter(rol =>
          rol.id === RolType.Vendor
        );
        break;

      default:
        // Por defecto, sin roles disponibles
        this.roles = [];
    }
  }

  cerrarModal() {
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    this.closeModal.emit(true);
  }

  resetForm() {
    this.usuarioForm.reset({
      rolId: this.rolIdPredeterminado ? this.rolIdPredeterminado.toString() : '',
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
    const formValues = this.usuarioForm.getRawValue(); // Usa getRawValue() para incluir campos deshabilitados

    const usuarioDto: UsuarioCrearDto = {
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      email: formValues.email,
      telefono: formValues.telefono,
      password: formValues.password,
      rolId: typeof formValues.rolId === 'string' ? parseInt(formValues.rolId, 10) : formValues.rolId,
      creadorId: this.creadorId
    };

    this.usuarioService.createUsuario(usuarioDto).subscribe({
      next: (usuario) => {
        // Si es un vendor, asignarlo al subcanal seleccionado
        if (usuario.rolId === RolType.Vendor && formValues.subcanalId) {
          const subcanalId = parseInt(formValues.subcanalId, 10);

          this.subcanalService.asignarVendorASubcanal(subcanalId, usuario.id).subscribe({
            next: () => {
              this.loading = false;
              this.usuarioCreado.emit(usuario);
              this.cerrarModal();
            },
            error: (err) => {
              this.loading = false;
              this.error = err?.error?.message || 'Error al asignar el vendor al subcanal. El usuario fue creado, pero deberá asignarlo manualmente.';
            }
          });
        } else {
          this.loading = false;
          this.usuarioCreado.emit(usuario);
          this.cerrarModal();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Error al crear el usuario. Intente nuevamente.';
      }
    });
  }
}
