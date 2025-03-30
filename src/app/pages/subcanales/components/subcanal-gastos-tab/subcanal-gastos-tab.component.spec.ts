import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalGastosTabComponent } from './subcanal-gastos-tab.component';

describe('SubcanalGastosTabComponent', () => {
  let component: SubcanalGastosTabComponent;
  let fixture: ComponentFixture<SubcanalGastosTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalGastosTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalGastosTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
