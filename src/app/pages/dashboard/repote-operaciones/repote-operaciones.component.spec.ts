import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RepoteOperacionesComponent } from './repote-operaciones.component';

describe('RepoteOperacionesComponent', () => {
  let component: RepoteOperacionesComponent;
  let fixture: ComponentFixture<RepoteOperacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RepoteOperacionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RepoteOperacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
