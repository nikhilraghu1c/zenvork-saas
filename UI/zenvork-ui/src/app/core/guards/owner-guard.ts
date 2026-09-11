import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';

/** Allows only business owners to open owner-management routes. */
export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getCurrentUser()?.role === 'OWNER'
    ? true
    : router.createUrlTree(['/app/dashboard']);
};
