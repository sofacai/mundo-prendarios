import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalAdminCanalComponent } from './subcanal-admin-canal.component';

describe('SubcanalAdminCanalComponent', () => {
  let component: SubcanalAdminCanalComponent;
  let fixture: ComponentFixture<SubcanalAdminCanalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalAdminCanalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalAdminCanalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
