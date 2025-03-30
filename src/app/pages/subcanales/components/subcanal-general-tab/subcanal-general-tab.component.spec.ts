import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalGeneralTabComponent } from './subcanal-general-tab.component';

describe('SubcanalGeneralTabComponent', () => {
  let component: SubcanalGeneralTabComponent;
  let fixture: ComponentFixture<SubcanalGeneralTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalGeneralTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalGeneralTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
