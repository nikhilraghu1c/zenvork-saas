import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(DashboardService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
