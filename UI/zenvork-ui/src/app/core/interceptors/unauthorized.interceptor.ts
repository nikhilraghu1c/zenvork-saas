import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../modules/auth/services/auth.service';

const isLoginRequest = (url: string) => url.replace(/\?.*$/, '').endsWith('/api/login');

/** Clears stale browser session metadata and sends protected-request 401 responses to login. */
export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      // Invalid credentials are handled by the login form instead of causing a redirect loop.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isLoginRequest(request.url)
      ) {
        const returnUrl = router.url.startsWith('/app') ? router.url : null;
        auth.clearExpiredSession();
        if (!router.url.startsWith('/login')) {
          void router.navigate(['/login'], {
            queryParams: { reason: 'expired', ...(returnUrl ? { returnUrl } : {}) },
          });
        }
      }

      return throwError(() => error);
    }),
  );
};
