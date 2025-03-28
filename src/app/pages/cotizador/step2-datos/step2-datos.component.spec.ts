import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Step2DatosComponent } from './step2-datos.component';

describe('Step2DatosComponent', () => {
  let component: Step2DatosComponent;
  let fixture: ComponentFixture<Step2DatosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [Step2DatosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Step2DatosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
