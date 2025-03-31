import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalVendedoresComponent } from './canal-vendedores.component';

describe('CanalVendedoresComponent', () => {
  let component: CanalVendedoresComponent;
  let fixture: ComponentFixture<CanalVendedoresComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalVendedoresComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalVendedoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
