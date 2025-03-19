import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WizardContainerComponent } from './wizard-container.component';

describe('WizardContainerComponent', () => {
  let component: WizardContainerComponent;
  let fixture: ComponentFixture<WizardContainerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [WizardContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WizardContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
