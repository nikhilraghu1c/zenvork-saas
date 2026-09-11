import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { StaffService } from './staff.service';

describe('StaffService', () => {
  let service: StaffService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(StaffService);
  });

  it('creates', () => {
    expect(service).toBeTruthy();
  });
});
