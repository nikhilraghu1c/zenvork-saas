import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  timeout,
} from 'rxjs';
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
  role: 'PLATFORM_ADMIN' | 'OWNER' | 'STAFF';
  businessId: string | null;
  businessName: string | null;
  bookingAccessScope: 'NONE' | 'OWN_AND_UNASSIGNED' | 'ALL';
  canSendReminders: boolean;
  passwordChangedAt: string | null;
}

export interface LoginResponse {
  message: string;
  user: AuthenticatedUser;
}

export interface LogoutResponse {
  message: string;
}

export interface SessionResponse {
  user: AuthenticatedUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

const AUTH_USER_STORAGE_KEY = 'zenvork.auth.user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthenticatedUser | null>(
    this.readStoredUser(),
  );
  private refreshRequest$: Observable<SessionResponse> | null = null;
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

  /** Restores safe user metadata from the cookie session when a tab first opens or reloads. */
  restoreSession(): Observable<void> {
    return this.getCurrentSession().pipe(
      map(() => undefined),
      catchError((error: unknown) => {
        if (!this.isUnauthorized(error)) {
          if (this.isForbidden(error)) {
            this.clearUser();
          }
          return of(undefined);
        }

        return this.refreshSession().pipe(
          map(() => undefined),
          catchError(() => {
            this.clearUser();
            return of(undefined);
          }),
        );
      }),
    );
  }

  /** Uses and rotates the durable HttpOnly refresh session to replace an expired access cookie. */
  refreshSession(): Observable<SessionResponse> {
    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.api.post<SessionResponse, Record<string, never>>('refresh', {}).pipe(
        tap((response) => this.storeUser(response.user)),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.refreshRequest$;
  }

  /** Replaces the authenticated user's password and refreshes the server-managed session cookie. */
  changePassword(payload: ChangePasswordRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }, ChangePasswordRequest>('change-password', payload);
  }

  /** Returns whether this browser tab currently has safe metadata for an authenticated user. */
  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  /** Returns the current safe user metadata without requiring an observable subscription. */
  getCurrentUser(): AuthenticatedUser | null {
    return this.userSubject.value;
  }

  /** Clears only browser-held metadata after the API reports that the HttpOnly session is invalid. */
  clearExpiredSession(): void {
    this.clearUser();
  }

  private getCurrentSession(): Observable<SessionResponse> {
    return this.api
      .get<SessionResponse>('me')
      .pipe(timeout(8_000), tap((response) => this.storeUser(response.user)));
  }

  private isUnauthorized(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 401;
  }

  private isForbidden(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 403;
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
