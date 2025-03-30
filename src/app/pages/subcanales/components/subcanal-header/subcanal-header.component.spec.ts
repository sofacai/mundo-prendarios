import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalHeaderComponent } from './subcanal-header.component';

describe('SubcanalHeaderComponent', () => {
  let component: SubcanalHeaderComponent;
  let fixture: ComponentFixture<SubcanalHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
