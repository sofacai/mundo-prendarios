import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioHeaderComponent } from './usuario-header.component';

describe('UsuarioHeaderComponent', () => {
  let component: UsuarioHeaderComponent;
  let fixture: ComponentFixture<UsuarioHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
