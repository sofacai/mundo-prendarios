import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TestClienteComponent } from './test-cliente.component';

describe('TestClienteComponent', () => {
  let component: TestClienteComponent;
  let fixture: ComponentFixture<TestClienteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestClienteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
