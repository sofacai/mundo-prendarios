import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalInfoBancariaComponent } from './canal-info-bancaria.component';

describe('CanalInfoBancariaComponent', () => {
  let component: CanalInfoBancariaComponent;
  let fixture: ComponentFixture<CanalInfoBancariaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalInfoBancariaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalInfoBancariaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
