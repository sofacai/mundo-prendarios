import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalVerPlanComponent } from './modal-ver-plan.component';

describe('ModalVerPlanComponent', () => {
  let component: ModalVerPlanComponent;
  let fixture: ComponentFixture<ModalVerPlanComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalVerPlanComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalVerPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
