import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalUbicacionComponent } from './canal-ubicacion.component';

describe('CanalUbicacionComponent', () => {
  let component: CanalUbicacionComponent;
  let fixture: ComponentFixture<CanalUbicacionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalUbicacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalUbicacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
