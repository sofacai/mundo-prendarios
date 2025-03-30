import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalEstadisticasTabComponent } from './subcanal-estadisticas-tab.component';

describe('SubcanalEstadisticasTabComponent', () => {
  let component: SubcanalEstadisticasTabComponent;
  let fixture: ComponentFixture<SubcanalEstadisticasTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalEstadisticasTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalEstadisticasTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
