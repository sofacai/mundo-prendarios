import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioPasswordComponent } from './usuario-password.component';

describe('UsuarioPasswordComponent', () => {
  let component: UsuarioPasswordComponent;
  let fixture: ComponentFixture<UsuarioPasswordComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioPasswordComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
