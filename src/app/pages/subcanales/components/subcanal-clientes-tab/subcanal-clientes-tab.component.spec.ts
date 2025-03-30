import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubcanalClientesTabComponent } from './subcanal-clientes-tab.component';

describe('SubcanalClientesTabComponent', () => {
  let component: SubcanalClientesTabComponent;
  let fixture: ComponentFixture<SubcanalClientesTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SubcanalClientesTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubcanalClientesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
