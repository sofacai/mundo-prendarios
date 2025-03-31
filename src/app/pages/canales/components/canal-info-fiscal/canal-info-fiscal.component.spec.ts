import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalInfoFiscalComponent } from './canal-info-fiscal.component';

describe('CanalInfoFiscalComponent', () => {
  let component: CanalInfoFiscalComponent;
  let fixture: ComponentFixture<CanalInfoFiscalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalInfoFiscalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalInfoFiscalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
