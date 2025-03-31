import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalHeaderComponent } from './canal-header.component';

describe('CanalHeaderComponent', () => {
  let component: CanalHeaderComponent;
  let fixture: ComponentFixture<CanalHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
