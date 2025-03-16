import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalEditarPlanComponent } from './modal-editar-plan.component';

describe('ModalEditarPlanComponent', () => {
  let component: ModalEditarPlanComponent;
  let fixture: ComponentFixture<ModalEditarPlanComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalEditarPlanComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEditarPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
