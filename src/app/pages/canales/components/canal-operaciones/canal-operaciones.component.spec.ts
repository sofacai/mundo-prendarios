import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalOperacionesComponent } from './canal-operaciones.component';

describe('CanalOperacionesComponent', () => {
  let component: CanalOperacionesComponent;
  let fixture: ComponentFixture<CanalOperacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalOperacionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalOperacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
