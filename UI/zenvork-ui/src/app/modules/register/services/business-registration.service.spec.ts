import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BusinessRegistrationService } from './business-registration.service';

describe('BusinessRegistrationService', () => {
  let service: BusinessRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(BusinessRegistrationService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
