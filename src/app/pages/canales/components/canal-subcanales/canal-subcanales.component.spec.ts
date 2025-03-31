import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalSubcanalesComponent } from './canal-subcanales.component';

describe('CanalSubcanalesComponent', () => {
  let component: CanalSubcanalesComponent;
  let fixture: ComponentFixture<CanalSubcanalesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalSubcanalesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalSubcanalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
