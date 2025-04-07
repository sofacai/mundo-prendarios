import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VendorSelectorComponent } from './vendor-selector.component';

describe('VendorSelectorComponent', () => {
  let component: VendorSelectorComponent;
  let fixture: ComponentFixture<VendorSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [VendorSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VendorSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
