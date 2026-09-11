import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter } from '@angular/router';
import { ownerGuard } from './owner-guard';

describe('ownerGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => ownerGuard(...guardParameters));

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('is created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
