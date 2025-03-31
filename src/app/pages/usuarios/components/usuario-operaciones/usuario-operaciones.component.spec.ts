import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioOperacionesComponent } from './usuario-operaciones.component';

describe('UsuarioOperacionesComponent', () => {
  let component: UsuarioOperacionesComponent;
  let fixture: ComponentFixture<UsuarioOperacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioOperacionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioOperacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
