import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../modules/auth/services/auth.service';

const isSessionRequest = (url: string) => {
  const path = url.replace(/\?.*$/, '');
  return ['/api/login', '/api/logout', '/api/me', '/api/refresh'].some((endpoint) => {
    return path.endsWith(endpoint);
  });
};

/** Retries one protected request after access expiry, then returns to login if refresh cannot recover it. */
export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isSessionRequest(request.url)
      ) {
        const returnUrl = router.url.startsWith('/app') ? router.url : null;
        return auth.refreshSession().pipe(
          switchMap(() => next(request)),
          catchError(() => {
            auth.clearExpiredSession();
            if (!router.url.startsWith('/login')) {
              void router.navigate(['/login'], {
                queryParams: { reason: 'expired', ...(returnUrl ? { returnUrl } : {}) },
              });
            }
            return throwError(() => error);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
