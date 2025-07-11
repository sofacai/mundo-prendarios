// reporte-operaciones.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';

import { OperacionService, Operacion } from '../../../core/services/operacion.service';
import { ClienteService, Cliente } from '../../../core/services/cliente.service';
import { CanalService, Canal } from '../../../core/services/canal.service';
import { SubcanalService, Subcanal } from '../../../core/services/subcanal.service';
import { UsuarioService, UsuarioDto } from '../../../core/services/usuario.service';
import { RolType } from '../../../core/models/usuario.model';
import { PlanService, Plan } from '../../../core/services/plan.service';

interface FiltrosReporte {
  fechaDesde: string;
  fechaHasta: string;
  estado?: string;
  canalId?: number;
  vendorId?: number;
}

interface OperacionCompleta extends Operacion {
  cliente?: Cliente;
  canal?: Canal;
  subcanal?: Subcanal;
  vendor?: UsuarioDto;
  plan?: Plan;
  usuarioCreador?: UsuarioDto;
}

@Component({
  selector: 'app-reporte-operaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="cerrarModal($event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Generar Reporte de Operaciones</h3>
          <button class="btn-close" (click)="cerrar()"></button>
        </div>

        <div class="modal-body">
          <!-- Filtros -->
          <div class="filtros-section">
            <h5>Filtros de búsqueda</h5>

            <div class="filtros-grid">
              <!-- Rango de fechas -->
              <div class="filtro-group">
                <label for="fechaDesde">Fecha desde:</label>
                <input type="date"
                       id="fechaDesde"
                       [(ngModel)]="filtros.fechaDesde"
                       class="form-control">
              </div>

              <div class="filtro-group">
                <label for="fechaHasta">Fecha hasta:</label>
                <input type="date"
                       id="fechaHasta"
                       [(ngModel)]="filtros.fechaHasta"
                       class="form-control">
              </div>

              <!-- Estado -->
              <div class="filtro-group">
                <label for="estado">Estado:</label>
                <select id="estado" [(ngModel)]="filtros.estado" class="form-control">
                  <option value="">Todos los estados</option>
                  <option value="EN ANALISIS">En análisis</option>
                  <option value="ANALISIS BCO">Análisis BCO</option>
                  <option value="APROBADO DEF">Aprobado definitivo</option>
                  <option value="FIRMAR DOCUM">Firmar documentos</option>
                  <option value="EN GESTION">En gestión</option>
                  <option value="COMPLETANDO DOCU">Completando documentos</option>
                  <option value="EN PROC.INSC.">En proceso inscripción</option>
                  <option value="EN PROC.LIQ.">En proceso liquidación</option>
                  <option value="LIQUIDADA">Liquidada</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
              </div>

              <!-- Canal -->
              <div class="filtro-group">
                <label for="canal">Canal:</label>
                <select id="canal" [(ngModel)]="filtros.canalId" class="form-control">
                  <option value="">Todos los canales</option>
                  <option *ngFor="let canal of canales" [value]="canal.id">
                    {{ canal.nombreFantasia }}
                  </option>
                </select>
              </div>

              <!-- Vendor -->
              <div class="filtro-group">
                <label for="vendor">Vendor:</label>
                <select id="vendor" [(ngModel)]="filtros.vendorId" class="form-control">
                  <option value="">Todos los vendors</option>
                  <option *ngFor="let vendor of vendors" [value]="vendor.id">
                    {{ vendor.nombre }} {{ vendor.apellido }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Resumen -->
          <div class="resumen-section" *ngIf="operacionesFiltradas.length > 0">
            <h5>Resumen del reporte</h5>
            <div class="resumen-stats">
              <div class="stat-item">
                <span class="stat-label">Total operaciones:</span>
                <span class="stat-value">{{ operacionesFiltradas.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Monto total:</span>
                <span class="stat-value">{{ formatMoney(getTotalMonto()) }}</span>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div *ngIf="cargando" class="loading-section">
            <div class="spinner"></div>
            <p>{{ mensajeCarga }}</p>
          </div>

          <!-- Error -->
          <div *ngIf="error" class="error-section">
            <i class="bi bi-exclamation-triangle"></i>
            <p>{{ error }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="cerrar()" [disabled]="cargando">
            Cancelar
          </button>
          <button class="btn btn-primary" (click)="buscarOperaciones()" [disabled]="cargando">
            <i class="bi bi-search"></i>
            Buscar operaciones
          </button>
          <button class="btn btn-success"
                  (click)="generarReporte()"
                  [disabled]="cargando || operacionesFiltradas.length === 0">
            <i class="bi bi-file-earmark-excel"></i>
            Generar Excel ({{ operacionesFiltradas.length }})
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .modal-container {
      background: #fff;
      border-radius: 8px;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #eef0f2;
      background-color: #f8f9fa;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #181c32;
    }

    .btn-close {
      background: transparent;
      border: none;
      width: 24px;
      height: 24px;
      cursor: pointer;
      opacity: 0.7;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close:before {
      content: "×";
      font-size: 24px;
      line-height: 1;
    }

    .btn-close:hover {
      opacity: 1;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex-grow: 1;
    }

    .filtros-section {
      margin-bottom: 24px;
    }

    .filtros-section h5 {
      margin-bottom: 16px;
      color: #181c32;
      font-weight: 600;
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .filtro-group {
      display: flex;
      flex-direction: column;
    }

    .filtro-group label {
      margin-bottom: 4px;
      font-weight: 500;
      color: #7e8299;
      font-size: 0.875rem;
    }

    .form-control {
      padding: 8px 12px;
      border: 1px solid #e4e6ef;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: border-color 0.15s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #009ef7;
      box-shadow: 0 0 0 0.2rem rgba(0, 158, 247, 0.25);
    }

    .resumen-section {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .resumen-section h5 {
      margin-bottom: 12px;
      color: #181c32;
      font-weight: 600;
    }

    .resumen-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-label {
      color: #7e8299;
      font-size: 0.875rem;
    }

    .stat-value {
      font-weight: 600;
      color: #181c32;
    }

    .loading-section {
      text-align: center;
      padding: 20px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #009ef7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-section {
      background-color: #fff5f8;
      color: #f1416c;
      padding: 16px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #eef0f2;
      background-color: #f8f9fa;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #e4e6ef;
      color: #7e8299;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #d1d3e0;
    }

    .btn-primary {
      background-color: #009ef7;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0095e8;
    }

    .btn-success {
      background-color: #50cd89;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #45b577;
    }

    @media (max-width: 768px) {
      .modal-container {
        margin: 10px;
        max-height: 95vh;
      }

      .filtros-grid {
        grid-template-columns: 1fr;
      }

      .modal-footer {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ReporteOperacionesComponent implements OnInit {
  // Output para comunicar el cierre del modal
  @Output() onCerrarModal = new EventEmitter<void>();

  // Propiedades
  filtros: FiltrosReporte = {
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    canalId: undefined,
    vendorId: undefined
  };

  // Datos para filtros
  canales: Canal[] = [];
  vendors: UsuarioDto[] = [];
  planes: Plan[] = [];

  // Operaciones filtradas
  operacionesFiltradas: OperacionCompleta[] = [];

  // Estados
  cargando = false;
  mensajeCarga = '';
  error: string | null = null;

  constructor(
    private operacionService: OperacionService,
    private clienteService: ClienteService,
    private canalService: CanalService,
    private subcanalService: SubcanalService,
    private usuarioService: UsuarioService,
    private planService: PlanService
  ) {}

  ngOnInit() {
    this.initializeFiltros();
    this.cargarDatosParaFiltros();
  }

  initializeFiltros() {
    const hoy = new Date();
    const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.filtros.fechaDesde = primerDiaDelMes.toISOString().split('T')[0];
    this.filtros.fechaHasta = hoy.toISOString().split('T')[0];
  }

  cargarDatosParaFiltros() {
    this.cargando = true;
    this.mensajeCarga = 'Cargando filtros...';

    forkJoin({
      canales: this.canalService.getCanales().pipe(catchError(() => of([]))),
      vendors: this.usuarioService.getUsuariosPorRol(RolType.Vendor).pipe(catchError(() => of([]))),
      planes: this.planService.getPlanes().pipe(catchError(() => of([])))
    }).pipe(
      finalize(() => {
        this.cargando = false;
        this.mensajeCarga = '';
      })
    ).subscribe({
      next: (result) => {
        this.canales = result.canales;
        this.vendors = result.vendors;
        this.planes = result.planes;
      },
      error: (err) => {
        this.error = 'Error al cargar los filtros';
      }
    });
  }

  buscarOperaciones() {
    this.cargando = true;
    this.mensajeCarga = 'Cargando reporte...';
    this.error = null;
    this.operacionesFiltradas = [];

    this.operacionService.getOperaciones().pipe(
      catchError((err) => {
        this.error = 'Error al cargar las operaciones';
        return of([]);
      }),
      finalize(() => {
        this.cargando = false;
        this.mensajeCarga = '';
      })
    ).subscribe((operaciones) => {
      this.procesarOperaciones(operaciones);
    });
  }

  procesarOperaciones(operaciones: Operacion[]) {
    // Aplicar filtros
    let operacionesFiltradas = operaciones.filter(op => this.aplicarFiltros(op));

    if (operacionesFiltradas.length === 0) {
      this.operacionesFiltradas = [];
      this.error = 'No se encontraron operaciones, probar otros filtros';
      return;
    }

    this.cargando = true;
    this.mensajeCarga = `Enriqueciendo datos de ${operacionesFiltradas.length} operaciones...`;

    // Enriquecer con datos relacionados
    this.enriquecerOperaciones(operacionesFiltradas);
  }

  aplicarFiltros(operacion: Operacion): boolean {
    // Filtro por fecha
    if (this.filtros.fechaDesde || this.filtros.fechaHasta) {
      if (!operacion.fechaCreacion) return false;
      
      // Crear una fecha en timezone local y extraer solo la parte de fecha
      const fechaOp = new Date(operacion.fechaCreacion);
      const year = fechaOp.getFullYear();
      const month = String(fechaOp.getMonth() + 1).padStart(2, '0');
      const day = String(fechaOp.getDate()).padStart(2, '0');
      const fechaOpStr = `${year}-${month}-${day}`;

      if (this.filtros.fechaDesde) {
        if (fechaOpStr < this.filtros.fechaDesde) return false;
      }

      if (this.filtros.fechaHasta) {
        if (fechaOpStr > this.filtros.fechaHasta) return false;
      }
    }

    // Filtro por estado
    if (this.filtros.estado && operacion.estado !== this.filtros.estado) {
      return false;
    }

    // Filtro por canal - convertir a número para comparación
    if (this.filtros.canalId && Number(operacion.canalId) !== Number(this.filtros.canalId)) {
      return false;
    }

    // Filtro por vendor - usar vendedorId, no vendorId
    if (this.filtros.vendorId && Number(operacion.vendedorId) !== Number(this.filtros.vendorId)) {
      return false;
    }

    return true;
  }

  enriquecerOperaciones(operaciones: Operacion[]) {
    const requests: Observable<any>[] = [];
    const operacionesCompletas: OperacionCompleta[] = [];

    operaciones.forEach((op, index) => {
      operacionesCompletas[index] = { ...op };

      // Cliente
      if (op.clienteId) {
        requests.push(
          this.clienteService.getClienteById(op.clienteId).pipe(
            catchError(() => of(null))
          )
        );
      }

      // Canal
      if (op.canalId) {
        requests.push(
          this.canalService.getCanal(op.canalId).pipe(
            catchError(() => of(null))
          )
        );
      }

      // Subcanal
      if (op.subcanalId) {
        requests.push(
          this.subcanalService.getSubcanal(op.subcanalId).pipe(
            catchError(() => of(null))
          )
        );
      }

      // Vendor
      if (op.vendedorId) {
        requests.push(
          this.usuarioService.getUsuario(op.vendedorId).pipe(
            catchError(() => of(null))
          )
        );
      }

      // Plan
      if (op.planId) {
        requests.push(
          this.planService.getPlan(op.planId).pipe(
            catchError(() => of(null))
          )
        );
      }

      // Usuario creador
      if (op.usuarioCreadorId) {
        requests.push(
          this.usuarioService.getUsuario(op.usuarioCreadorId).pipe(
            catchError(() => of(null))
          )
        );
      }
    });

    // Ejecutar todas las requests en paralelo
    forkJoin(requests).pipe(
      finalize(() => {
        this.cargando = false;
        this.mensajeCarga = '';
      })
    ).subscribe({
      next: (resultados) => {
        let resultIndex = 0;

        operaciones.forEach((op, opIndex) => {
          if (op.clienteId) {
            operacionesCompletas[opIndex].cliente = resultados[resultIndex++];
          }
          if (op.canalId) {
            operacionesCompletas[opIndex].canal = resultados[resultIndex++];
          }
          if (op.subcanalId) {
            operacionesCompletas[opIndex].subcanal = resultados[resultIndex++];
          }
          if (op.vendedorId) {
            operacionesCompletas[opIndex].vendor = resultados[resultIndex++];
          }
          if (op.planId) {
            operacionesCompletas[opIndex].plan = resultados[resultIndex++];
          }
          if (op.usuarioCreadorId) {
            operacionesCompletas[opIndex].usuarioCreador = resultados[resultIndex++];
          }
        });

        this.operacionesFiltradas = operacionesCompletas;
      },
      error: (err) => {
        this.error = 'Error al enriquecer los datos de las operaciones';
        this.operacionesFiltradas = operaciones.map(op => ({ ...op }));
      }
    });
  }

  generarReporte() {
    if (this.operacionesFiltradas.length === 0) return;

    this.cargando = true;
    this.mensajeCarga = 'Generando archivo Excel...';

    try {
      // Preparar datos para Excel (fechas como objetos Date, sin columna 'Liquidada')
      const datosExcel = this.operacionesFiltradas.map(op => ({
        'ID Operación': op.id,
        'Fecha Creación': op.fechaCreacion ? new Date(op.fechaCreacion) : '',
        'Estado': op.estado || 'Sin estado',
        'Fecha Aprobación': op.fechaAprobacion ? new Date(op.fechaAprobacion) : '',
        'Fecha Liquidación': op.fechaLiquidacion ? new Date(op.fechaLiquidacion) : '',
        // 'Liquidada' columna eliminada
        'Cliente': op.cliente ? `${op.cliente.nombre} ${op.cliente.apellido}` : op.clienteNombre || '',
        'Cliente Teléfono': op.cliente?.telefono || '',
        'Cliente Email': op.cliente?.email || '',
        'Cliente CUIL': op.cliente?.cuil || '',
        'Canal': op.canal?.nombreFantasia || op.canalNombre || '',
        'Subcanal': op.subcanal?.nombre || op.subcanalNombre || '',
        'Subcanal Provincia': op.subcanal?.provincia || '',
        'Subcanal Localidad': op.subcanal?.localidad || '',
        'Vendor ID': op.vendor?.id || op.vendedorId || '',
        'Vendor': op.vendor ? `${op.vendor.nombre} ${op.vendor.apellido}` : op.vendedorNombre || '',
        'Vendor Email': op.vendor?.email || '',
        'Plan': op.plan?.nombre || op.planNombre || '',
        'Usuario Creador ID': op.usuarioCreador?.id || op.usuarioCreadorId || '',
        'Usuario Creador': op.usuarioCreador ? `${op.usuarioCreador.nombre} ${op.usuarioCreador.apellido}` : '',
        'Usuario Creador Email': op.usuarioCreador?.email || '',
        'Monto Inicial': op.monto || 0,
        'Gasto Inicial': op.gastoInicial || 0,
        'Plazo Inicial (meses)': op.meses || 0,
        'Tasa Inicial (%)': op.tasa || 0,
        'Cuota Inicial': op.cuotaInicial || '',
        'Cuota Promedio Inicial': op.cuotaPromedio || '',
        'Auto Inicial': op.autoInicial || '',
        'Monto Aprobado': op.montoAprobado || '',
        'Plazo Aprobado (meses)': op.mesesAprobados || '',
        'Tasa Aprobada (%)': op.tasaAprobada || '',
        'Plan Aprobado': op.planAprobadoNombre || '',
        'Cuota Inicial Aprobada': op.cuotaInicialAprobada || '',
        'Cuota Promedio Aprobada': op.cuotaPromedioAprobada || '',
        'Auto Aprobado': op.autoAprobado || '',
        'URL Aprobado Definitivo': op.urlAprobadoDefinitivo || '',
        'Observaciones': op.observaciones || ''
      }));

      // Crear workbook
      const ws = XLSX.utils.json_to_sheet(datosExcel);

      // Aplicar formato de fecha a las columnas de fecha
      const dateCols = ['Fecha Creación', 'Fecha Aprobación', 'Fecha Liquidación'];
      dateCols.forEach(col => {
        const colIdx = Object.keys(datosExcel[0]).indexOf(col);
        if (colIdx === -1) return;
        for (let row = 2; row <= datosExcel.length + 1; row++) { // +1 por encabezado
          const cellRef = XLSX.utils.encode_cell({ c: colIdx, r: row - 1 });
          const cell = ws[cellRef];
          if (cell && cell.v instanceof Date) {
            cell.t = 'd'; // tipo date
            cell.z = 'yyyy-mm-dd'; // formato ISO
          }
        }
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Operaciones');

      // Ajustar ancho de columnas
      const colWidths = Object.keys(datosExcel[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;

      // Generar nombre del archivo
      const fechaDesde = this.filtros.fechaDesde || 'inicio';
      const fechaHasta = this.filtros.fechaHasta || 'fin';
      const nombreArchivo = `Reporte_Operaciones_${fechaDesde}_${fechaHasta}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);

      this.cargando = false;
      this.mensajeCarga = '';

      // Opcional: cerrar modal después de generar
      // this.cerrar();

    } catch (error) {
      this.cargando = false;
      this.mensajeCarga = '';
      this.error = 'Error al generar el archivo Excel';
      console.error('Error generando Excel:', error);
    }
  }

  // Métodos auxiliares
  // formatDateForExcel ya no es necesario para exportar fechas como Date
  formatDateForExcel(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTotalMonto(): number {
    return this.operacionesFiltradas.reduce((total, op) => total + (op.monto || 0), 0);
  }

  getOperacionesLiquidadas(): number {
    // Considera como liquidadas solo las que tienen estado 'LIQUIDADA' y fechaLiquidacion válida
    return this.operacionesFiltradas.filter(op => (op.estado || '').toUpperCase() === 'LIQUIDADA' && !!op.fechaLiquidacion).length;
  }

  cerrarModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cerrar();
    }
  }

  cerrar() {
    // Resetear datos antes de cerrar
    this.operacionesFiltradas = [];
    this.error = null;
    this.cargando = false;
    this.mensajeCarga = '';

    // Emitir evento para cerrar el modal
    this.onCerrarModal.emit();
  }
}
