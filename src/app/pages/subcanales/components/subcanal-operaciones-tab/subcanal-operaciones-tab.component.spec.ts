import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalOperacionesTabComponent } from './subcanal-operaciones-tab.component';

describe('SubcanalOperacionesTabComponent', () => {
  let component: SubcanalOperacionesTabComponent;
  let fixture: ComponentFixture<SubcanalOperacionesTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalOperacionesTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalOperacionesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
