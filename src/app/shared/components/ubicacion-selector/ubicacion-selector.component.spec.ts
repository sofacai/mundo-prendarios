import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UbicacionSelectorComponent } from './ubicacion-selector.component';

describe('UbicacionSelectorComponent', () => {
  let component: UbicacionSelectorComponent;
  let fixture: ComponentFixture<UbicacionSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UbicacionSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UbicacionSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
