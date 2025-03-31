import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalTabsNavigationComponent } from './canal-tabs-navigation.component';

describe('CanalTabsNavigationComponent', () => {
  let component: CanalTabsNavigationComponent;
  let fixture: ComponentFixture<CanalTabsNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalTabsNavigationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalTabsNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
