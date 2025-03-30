import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GastoFormModalComponent } from './gasto-form-modal.component';

describe('GastoFormModalComponent', () => {
  let component: GastoFormModalComponent;
  let fixture: ComponentFixture<GastoFormModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GastoFormModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GastoFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
