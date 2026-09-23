import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

describe('unauthorizedInterceptor', () => {
  let auth: AuthService;
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let router: { url: string; navigate: jasmine.Spy };

  beforeEach(() => {
    sessionStorage.setItem(
      'zenvork.auth.user',
      JSON.stringify({
        id: 'user-1',
        name: 'Owner',
        email: 'owner@example.com',
        mobile: '9876543210',
        role: 'OWNER',
        businessId: 'business-1',
      }),
    );
    router = { url: '/app/booking', navigate: jasmine.createSpy().and.resolveTo(true) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('clears cached user data and redirects a protected-request 401 to login', () => {
    http.get('http://localhost:4001/api/bookings').subscribe({ error: () => undefined });

    httpTesting
      .expectOne('http://localhost:4001/api/bookings')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { reason: 'expired', returnUrl: '/app/booking' },
    });
  });

  it('leaves an invalid login response for the login form to handle', () => {
    http.post('http://localhost:4001/api/login', {}).subscribe({ error: () => undefined });

    httpTesting
      .expectOne('http://localhost:4001/api/login')
      .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
