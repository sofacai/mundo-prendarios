import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioDto } from 'src/app/core/services/usuario.service';

@Component({
  selector: 'app-subcanal-admin-canal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcanal-admin-canal.component.html',
  styleUrls: ['./subcanal-admin-canal.component.scss']
})
export class SubcanalAdminCanalComponent {
  @Input() adminCanal: UsuarioDto | null = null;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  constructor() { }

  getEstadoClass(activo: boolean): string {
    return activo ? 'badge-success' : 'badge-danger';
  }
}
