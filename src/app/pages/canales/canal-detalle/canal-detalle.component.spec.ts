import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalDetalleComponent } from './canal-detalle.component';

describe('CanalDetalleComponent', () => {
  let component: CanalDetalleComponent;
  let fixture: ComponentFixture<CanalDetalleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalDetalleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
