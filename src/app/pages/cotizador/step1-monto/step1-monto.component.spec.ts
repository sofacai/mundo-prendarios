import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Step1MontoComponent } from './step1-monto.component';

describe('Step1MontoComponent', () => {
  let component: Step1MontoComponent;
  let fixture: ComponentFixture<Step1MontoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [Step1MontoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Step1MontoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
