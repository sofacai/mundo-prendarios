import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalSelectorComponent } from './subcanal-selector.component';

describe('SubcanalSelectorComponent', () => {
  let component: SubcanalSelectorComponent;
  let fixture: ComponentFixture<SubcanalSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
