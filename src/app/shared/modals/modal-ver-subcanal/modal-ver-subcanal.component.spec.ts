import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalVerSubcanalComponent } from './modal-ver-subcanal.component';

describe('ModalVerSubcanalComponent', () => {
  let component: ModalVerSubcanalComponent;
  let fixture: ComponentFixture<ModalVerSubcanalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalVerSubcanalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalVerSubcanalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
