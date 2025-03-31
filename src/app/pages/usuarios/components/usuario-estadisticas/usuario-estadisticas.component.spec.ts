import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioEstadisticasComponent } from './usuario-estadisticas.component';

describe('UsuarioEstadisticasComponent', () => {
  let component: UsuarioEstadisticasComponent;
  let fixture: ComponentFixture<UsuarioEstadisticasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioEstadisticasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioEstadisticasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
