import { TestBed } from '@angular/core/testing';

import { SubcanalService } from './subcanal.service';

describe('SubcanalService', () => {
  let service: SubcanalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubcanalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
