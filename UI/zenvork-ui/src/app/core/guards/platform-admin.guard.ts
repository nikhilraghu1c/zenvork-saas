import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';

/** Keeps platform administration separate from tenant workspaces. */
export const platformAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.getCurrentUser()?.role === 'PLATFORM_ADMIN' ? true : router.createUrlTree(['/login']);
};
