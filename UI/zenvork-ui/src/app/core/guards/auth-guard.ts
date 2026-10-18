import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getCurrentUser();
  if (!user) return router.createUrlTree(['/login']);
  return user.role === 'PLATFORM_ADMIN' ? router.createUrlTree(['/admin/dashboard']) : true;
};
