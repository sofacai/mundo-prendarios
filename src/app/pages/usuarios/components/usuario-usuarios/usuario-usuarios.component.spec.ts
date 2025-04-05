import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioUsuariosComponent } from './usuario-usuarios.component';

describe('UsuarioUsuariosComponent', () => {
  let component: UsuarioUsuariosComponent;
  let fixture: ComponentFixture<UsuarioUsuariosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioUsuariosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
