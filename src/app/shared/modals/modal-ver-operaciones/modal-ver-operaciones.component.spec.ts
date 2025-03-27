import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalVerOperacionesComponent } from './modal-ver-operaciones.component';

describe('ModalVerOperacionesComponent', () => {
  let component: ModalVerOperacionesComponent;
  let fixture: ComponentFixture<ModalVerOperacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalVerOperacionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalVerOperacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
