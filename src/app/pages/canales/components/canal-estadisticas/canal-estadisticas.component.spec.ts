import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalEstadisticasComponent } from './canal-estadisticas.component';

describe('CanalEstadisticasComponent', () => {
  let component: CanalEstadisticasComponent;
  let fixture: ComponentFixture<CanalEstadisticasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalEstadisticasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalEstadisticasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
