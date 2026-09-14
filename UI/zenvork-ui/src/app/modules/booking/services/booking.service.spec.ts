import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  });

  it('creates', () => {
    expect(TestBed.inject(BookingService)).toBeTruthy();
  });
});
