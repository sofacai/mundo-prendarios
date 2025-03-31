import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CanalOficialesComponent } from './canal-oficiales.component';

describe('CanalOficialesComponent', () => {
  let component: CanalOficialesComponent;
  let fixture: ComponentFixture<CanalOficialesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CanalOficialesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CanalOficialesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
