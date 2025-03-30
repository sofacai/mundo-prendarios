import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalVendedoresTabComponent } from './subcanal-vendedores-tab.component';

describe('SubcanalVendedoresTabComponent', () => {
  let component: SubcanalVendedoresTabComponent;
  let fixture: ComponentFixture<SubcanalVendedoresTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalVendedoresTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalVendedoresTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
