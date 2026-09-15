import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { BookingFormService } from './booking-form.service';

describe('BookingFormService', () => {
  let service: BookingFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(BookingFormService);
  });

  it('creates', () => expect(service).toBeTruthy());
});
