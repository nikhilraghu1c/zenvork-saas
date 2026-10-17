import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';

/** Allows the Reminder workspace only to owners and staff granted reminder access. */
export const reminderAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getCurrentUser()?.canSendReminders === true
    ? true
    : router.createUrlTree(['/app/dashboard']);
};
