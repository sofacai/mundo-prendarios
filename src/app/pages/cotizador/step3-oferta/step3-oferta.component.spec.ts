import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Step3OfertaComponent } from './step3-oferta.component';

describe('Step3OfertaComponent', () => {
  let component: Step3OfertaComponent;
  let fixture: ComponentFixture<Step3OfertaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [Step3OfertaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Step3OfertaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
