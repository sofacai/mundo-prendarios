import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OperacionDetalleComponent } from './operacion-detalle.component';

describe('OperacionDetalleComponent', () => {
  let component: OperacionDetalleComponent;
  let fixture: ComponentFixture<OperacionDetalleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [OperacionDetalleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OperacionDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
