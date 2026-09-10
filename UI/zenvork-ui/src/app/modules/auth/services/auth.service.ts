import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  role: 'OWNER' | 'STAFF';
  businessId: string;
}

export interface LoginResponse {
  message: string;
  user: AuthenticatedUser;
}

export interface LogoutResponse {
  message: string;
}

const AUTH_USER_STORAGE_KEY = 'zenvork.auth.user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthenticatedUser | null>(
    this.readStoredUser(),
  );
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  /** Starts the server-managed cookie session and retains safe user metadata for this browser tab. */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api
      .post<LoginResponse, LoginRequest>('login', credentials)
      .pipe(tap((response) => this.storeUser(response.user)));
  }

  /** Ends the server-managed cookie session and clears client-side user metadata. */
  logout(): Observable<LogoutResponse> {
    return this.api
      .post<LogoutResponse, Record<string, never>>('logout', {})
      .pipe(tap(() => this.clearUser()));
  }

  /** Returns whether this browser tab currently has safe metadata for an authenticated user. */
  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  /** Returns the current safe user metadata without requiring an observable subscription. */
  getCurrentUser(): AuthenticatedUser | null {
    return this.userSubject.value;
  }

  private storeUser(user: AuthenticatedUser): void {
    this.userSubject.next(user);
    sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  }

  private clearUser(): void {
    this.userSubject.next(null);
    sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  private readStoredUser(): AuthenticatedUser | null {
    const storedUser = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as AuthenticatedUser;
    } catch {
      sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return null;
    }
  }
}
