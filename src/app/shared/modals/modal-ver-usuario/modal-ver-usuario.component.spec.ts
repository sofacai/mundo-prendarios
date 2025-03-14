import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalVerUsuarioComponent } from './modal-ver-usuario.component';

describe('ModalVerUsuarioComponent', () => {
  let component: ModalVerUsuarioComponent;
  let fixture: ComponentFixture<ModalVerUsuarioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalVerUsuarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalVerUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
