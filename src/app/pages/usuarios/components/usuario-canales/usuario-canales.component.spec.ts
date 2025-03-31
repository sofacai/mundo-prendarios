import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioCanalesComponent } from './usuario-canales.component';

describe('UsuarioCanalesComponent', () => {
  let component: UsuarioCanalesComponent;
  let fixture: ComponentFixture<UsuarioCanalesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioCanalesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioCanalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
