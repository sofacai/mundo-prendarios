import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalGeneralInfoComponent } from './canal-general-info.component';

describe('CanalGeneralInfoComponent', () => {
  let component: CanalGeneralInfoComponent;
  let fixture: ComponentFixture<CanalGeneralInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalGeneralInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalGeneralInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
