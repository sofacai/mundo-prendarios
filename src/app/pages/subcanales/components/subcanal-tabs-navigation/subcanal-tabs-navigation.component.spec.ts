import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalTabsNavigationComponent } from './subcanal-tabs-navigation.component';

describe('SubcanalTabsNavigationComponent', () => {
  let component: SubcanalTabsNavigationComponent;
  let fixture: ComponentFixture<SubcanalTabsNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalTabsNavigationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalTabsNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
