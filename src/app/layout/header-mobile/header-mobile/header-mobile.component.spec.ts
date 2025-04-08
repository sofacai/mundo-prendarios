import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HeaderMobileComponent } from './header-mobile.component';

describe('HeaderMobileComponent', () => {
  let component: HeaderMobileComponent;
  let fixture: ComponentFixture<HeaderMobileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HeaderMobileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
