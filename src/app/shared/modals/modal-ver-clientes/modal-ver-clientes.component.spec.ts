import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalVerClientesComponent } from './modal-ver-clientes.component';

describe('ModalVerClientesComponent', () => {
  let component: ModalVerClientesComponent;
  let fixture: ComponentFixture<ModalVerClientesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalVerClientesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalVerClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
