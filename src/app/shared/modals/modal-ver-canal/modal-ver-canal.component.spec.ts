import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalVerCanalComponent } from './modal-ver-canal.component';

describe('ModalVerCanalComponent', () => {
  let component: ModalVerCanalComponent;
  let fixture: ComponentFixture<ModalVerCanalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalVerCanalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalVerCanalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
