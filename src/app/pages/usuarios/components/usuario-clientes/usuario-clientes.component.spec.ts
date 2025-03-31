import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioClientesComponent } from './usuario-clientes.component';

describe('UsuarioClientesComponent', () => {
  let component: UsuarioClientesComponent;
  let fixture: ComponentFixture<UsuarioClientesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioClientesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
