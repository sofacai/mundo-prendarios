import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioDto, VendorEstadisticasDto } from 'src/app/core/services/usuario.service';
import { RolType } from 'src/app/core/models/usuario.model';
import { Cliente } from 'src/app/core/services/cliente.service';
import { Operacion } from 'src/app/core/services/operacion.service';
import { Subcanal } from 'src/app/core/services/subcanal.service';

@Component({
  selector: 'app-usuario-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-header.component.html',
  styleUrls: ['./usuario-header.component.scss']
})
export class UsuarioHeaderComponent {
  @Input() usuario!: UsuarioDto;
  @Input() estadisticas: VendorEstadisticasDto | null = null;
  @Input() clientes: Cliente[] = [];
  @Input() operaciones: Operacion[] = [];
  @Input() operacionesActivas: number = 0;
  @Input() montoTotal: number = 0;
  @Input() subcanales: Subcanal[] = [];

  @Output() toggleEstado = new EventEmitter<void>();
  @Output() changePassword = new EventEmitter<void>();
  @Output() saveUsuarioData = new EventEmitter<any>();

  // Constantes para mapear el tipo de rol a un nombre legible
  readonly ROL_NAMES = {
    1: 'Administrador',
    2: 'Admin de Canal',
    3: 'Vendor',
    4: 'Oficial Comercial'
  };

  // Control de edición
  isEditingUsuario: boolean = false;
  usuarioForm: any = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  };

  constructor(private router: Router) { }

  ngOnChanges() {
    if (this.usuario) {
      this.usuarioForm = {
        nombre: this.usuario.nombre || '',
        apellido: this.usuario.apellido || '',
        email: this.usuario.email || '',
        telefono: this.usuario.telefono || ''
      };
    }
  }

  onToggleEstado(): void {
    this.toggleEstado.emit();
  }

  onChangePassword(): void {
    this.changePassword.emit();
  }

  // Métodos para edición del usuario
  toggleEditingUsuario(): void {
    this.isEditingUsuario = true;
  }

  saveUsuario(): void {
    this.saveUsuarioData.emit(this.usuarioForm);
    this.isEditingUsuario = false;
  }

  cancelEditingUsuario(): void {
    // Restaurar valores originales
    this.usuarioForm = {
      nombre: this.usuario.nombre || '',
      apellido: this.usuario.apellido || '',
      email: this.usuario.email || '',
      telefono: this.usuario.telefono || ''
    };
    this.isEditingUsuario = false;
  }

  // Obtener iniciales del nombre para el avatar
  getInitials(): string {
    if (!this.usuario) return '';

    const nombre = this.usuario.nombre || '';
    const apellido = this.usuario.apellido || '';

    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return 'No disponible';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  // Método para obtener el rol como texto
  getRolName(): string {
    if (!this.usuario) return '';

    // Usando el índice como un número
    const rolId = this.usuario.rolId;
    return (rolId && this.ROL_NAMES[rolId as keyof typeof this.ROL_NAMES]) ||
           this.usuario.rolNombre ||
           'Desconocido';
  }

  // Método para calcular días desde la última operación
  getDaysSinceLastOperation(): number {
    if (!this.estadisticas?.fechaUltimaOperacion) return 0;

    const lastOpDate = new Date(this.estadisticas.fechaUltimaOperacion);
    const today = new Date();

    // Cálculo de la diferencia en días
    const diffTime = Math.abs(today.getTime() - lastOpDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // Método para obtener la clase del badge según los días sin operaciones
  getDaysBadgeClass(days: number): string {
    if (days <= 10) {
      return 'days-good';
    } else if (days <= 20) {
      return 'days-warning';
    } else {
      return 'days-danger';
    }
  }

  // Método para manejar el clic en un subcanal
  onSubcanalClick(subcanalId: number): void {
    this.router.navigate(['/subcanales', subcanalId]);
  }

  // Obtener cantidad de operaciones liquidadas
  getOperacionesLiquidadas(): number {
    return this.operaciones.filter(op => op.estado && op.estado.toLowerCase() === 'liquidada').length;
  }

  // Obtener cantidad de operaciones aprobadas
  getOperacionesAprobadas(): number {
    return this.operaciones.filter(op =>
      ['EN PROC.LIQ.', 'EN PROC.INSC.', 'FIRMAR DOCUM', 'EN GESTION', 'APROBADO DEF']
      .includes(op.estado || '')
    ).length;
  }

  // Obtener monto total de operaciones liquidadas
  getMontoTotalLiquidadas(): number {
    return this.operaciones
      .filter(op => op.estado && op.estado.toLowerCase() === 'liquidada')
      .reduce((total, op) => total + op.monto, 0);
  }

  // Método para formatear montos sin decimales
  formatMontoSinDecimales(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Método para formatear montos grandes con K, M, etc.
  formatMontoAbreviado(amount: number): string {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return `$${amount}`;
  }
}
