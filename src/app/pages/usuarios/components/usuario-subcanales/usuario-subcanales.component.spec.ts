import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioSubcanalesComponent } from './usuario-subcanales.component';

describe('UsuarioSubcanalesComponent', () => {
  let component: UsuarioSubcanalesComponent;
  let fixture: ComponentFixture<UsuarioSubcanalesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioSubcanalesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioSubcanalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
