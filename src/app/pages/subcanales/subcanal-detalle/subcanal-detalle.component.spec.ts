import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalDetalleComponent } from './subcanal-detalle.component';

describe('SubcanalDetalleComponent', () => {
  let component: SubcanalDetalleComponent;
  let fixture: ComponentFixture<SubcanalDetalleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalDetalleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
