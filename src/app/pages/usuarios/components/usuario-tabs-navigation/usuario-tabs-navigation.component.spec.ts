import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsuarioTabsNavigationComponent } from './usuario-tabs-navigation.component';

describe('UsuarioTabsNavigationComponent', () => {
  let component: UsuarioTabsNavigationComponent;
  let fixture: ComponentFixture<UsuarioTabsNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioTabsNavigationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioTabsNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
