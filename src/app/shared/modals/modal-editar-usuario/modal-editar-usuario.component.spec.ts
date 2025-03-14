import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalEditarUsuarioComponent } from './modal-editar-usuario.component';

describe('ModalEditarUsuarioComponent', () => {
  let component: ModalEditarUsuarioComponent;
  let fixture: ComponentFixture<ModalEditarUsuarioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalEditarUsuarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEditarUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
