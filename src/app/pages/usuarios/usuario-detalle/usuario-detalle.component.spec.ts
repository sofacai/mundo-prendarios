import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioDetalleComponent } from './usuario-detalle.component';

describe('UsuarioDetalleComponent', () => {
  let component: UsuarioDetalleComponent;
  let fixture: ComponentFixture<UsuarioDetalleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioDetalleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
