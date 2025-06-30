import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReporteOperacionesComponent } from './repote-operaciones.component';

describe('RepoteOperacionesComponent', () => {
  let component: ReporteOperacionesComponent;
  let fixture: ComponentFixture<ReporteOperacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReporteOperacionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReporteOperacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
