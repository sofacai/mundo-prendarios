import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KommoTestComponent } from './kommo-test.component';

describe('KommoTestComponent', () => {
  let component: KommoTestComponent;
  let fixture: ComponentFixture<KommoTestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [KommoTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KommoTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
