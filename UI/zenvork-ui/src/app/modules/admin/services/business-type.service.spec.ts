import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { BusinessTypeService } from './business-type.service';

describe('BusinessTypeService', () => {
  let service: BusinessTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(BusinessTypeService);
  });

  it('creates', () => {
    expect(service).toBeTruthy();
  });
});
