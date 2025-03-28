import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalEditarSubcanalComponent } from './modal-editar-subcanal.component';

describe('ModalEditarSubcanalComponent', () => {
  let component: ModalEditarSubcanalComponent;
  let fixture: ComponentFixture<ModalEditarSubcanalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalEditarSubcanalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEditarSubcanalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
