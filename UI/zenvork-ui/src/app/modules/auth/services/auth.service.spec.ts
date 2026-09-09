import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retain safe user metadata after login and clear it after logout', () => {
    service.login({ email: 'owner@example.com', password: 'password' }).subscribe();

    const loginRequest = httpTesting.expectOne('http://localhost:4001/api/login');
    expect(loginRequest.request.withCredentials).toBeTrue();
    loginRequest.flush({
      message: 'Login successful',
      user: {
        id: 'user-1',
        name: 'Owner',
        email: 'owner@example.com',
        role: 'OWNER',
        businessId: 'business-1',
      },
    });
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getCurrentUser()?.name).toBe('Owner');

    service.logout().subscribe();

    const logoutRequest = httpTesting.expectOne('http://localhost:4001/api/logout');
    expect(logoutRequest.request.withCredentials).toBeTrue();
    logoutRequest.flush({ message: 'Logout successful' });
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
  });
});
