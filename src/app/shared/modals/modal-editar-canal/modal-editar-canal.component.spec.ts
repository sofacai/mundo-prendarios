import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalEditarCanalComponent } from './modal-editar-canal.component';

describe('ModalEditarCanalComponent', () => {
  let component: ModalEditarCanalComponent;
  let fixture: ComponentFixture<ModalEditarCanalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalEditarCanalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEditarCanalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
