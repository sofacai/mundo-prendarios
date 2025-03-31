import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalPlanesComponent } from './canal-planes.component';

describe('CanalPlanesComponent', () => {
  let component: CanalPlanesComponent;
  let fixture: ComponentFixture<CanalPlanesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalPlanesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalPlanesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
