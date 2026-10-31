import { InitialsPipe } from '../../../../core/pipes/initials.pipe';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../modules/auth/services/auth.service';
import { CoreTranslationKey } from '../../../../core/i18n/core.translations';
import { ThemeService } from '../../../../core/services/theme.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

interface NavigationItem {
  labelKey: CoreTranslationKey;
  icon: string;
  route: string;
  requiresOwner?: boolean;
  requiresReminderAccess?: boolean;
}

interface NavigationGroup {
  labelKey: CoreTranslationKey;
  items: NavigationItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    InitialsPipe,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  /** Lets the layout close the mobile drawer after a route is selected. */
  @Output() navigationSelected = new EventEmitter<void>();

  /** Every planned workspace is available as a route for navigation preview. */
  private readonly tenantNavigationGroups: NavigationGroup[] = [
    {
      labelKey: 'navigation.overview',
      items: [{ labelKey: 'navigation.dashboard', icon: 'dashboard', route: '/app/dashboard' }],
    },
    {
      labelKey: 'navigation.workspace',
      items: [
        { labelKey: 'navigation.bookings', icon: 'calendar_month', route: '/app/booking' },
        { labelKey: 'navigation.clients', icon: 'groups', route: '/app/clients', requiresOwner: true },
        { labelKey: 'navigation.staff', icon: 'badge', route: '/app/staff', requiresOwner: true },
        { labelKey: 'navigation.resources', icon: 'inventory_2', route: '/app/resources' },
        { labelKey: 'navigation.services', icon: 'miscellaneous_services', route: '/app/services' },
        {
          labelKey: 'navigation.reminders',
          icon: 'notifications',
          route: '/app/reminders',
          requiresReminderAccess: true,
        },
        { labelKey: 'navigation.aiAssistant', icon: 'auto_awesome', route: '/app/ai-assistant' },
      ],
    },
    {
      labelKey: 'navigation.insights',
      items: [
        { labelKey: 'navigation.analytics', icon: 'analytics', route: '/app/analytics', requiresOwner: true },
      ],
    },
    {
      labelKey: 'navigation.business',
      items: [{ labelKey: 'navigation.settings', icon: 'settings', route: '/app/settings' }],
    },
  ];

  private readonly adminNavigationGroups: NavigationGroup[] = [
    {
      labelKey: 'navigation.platform',
      items: [
        { labelKey: 'navigation.dashboard', icon: 'dashboard', route: '/admin/dashboard' },
        { labelKey: 'navigation.businesses', icon: 'business', route: '/admin/businesses' },
        { labelKey: 'navigation.businessTypes', icon: 'category', route: '/admin/business-types' },
        { labelKey: 'navigation.resourceTypes', icon: 'inventory_2', route: '/admin/resource-types' },
        { labelKey: 'navigation.settings', icon: 'settings', route: '/admin/settings' },
      ],
    },
  ];

  protected loadingLogout = false;
  protected logoutError = '';
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  /** Returns the signed-in user's name, with a safe fallback during startup. */
  protected get userName(): string {
    return this.auth.getCurrentUser()?.name ?? this.language.translate('account.businessUser');
  }

  protected get navigationGroups(): NavigationGroup[] {
    return this.auth.getCurrentUser()?.role === 'PLATFORM_ADMIN'
      ? this.adminNavigationGroups
      : this.tenantNavigationGroups;
  }

  protected get dashboardRoute(): string {
    return this.auth.getCurrentUser()?.role === 'PLATFORM_ADMIN'
      ? '/admin/dashboard'
      : '/app/dashboard';
  }

  protected get userWorkspaceLabel(): string {
    const user = this.auth.getCurrentUser();
    if (user?.role === 'PLATFORM_ADMIN') {
      return this.language.translate('account.platformAdmin');
    }
    return user?.businessName ?? this.language.translate('account.yourBusiness');
  }

  /** Hides workspaces the signed-in user is not permitted to access. */
  protected canView(item: NavigationItem): boolean {
    const user = this.auth.getCurrentUser();
    return (
      (!item.requiresOwner || user?.role === 'OWNER') &&
      (!item.requiresReminderAccess || user?.canSendReminders === true)
    );
  }

  /** Avoids presenting an empty navigation section when every item is role-restricted. */
  protected canViewGroup(group: NavigationGroup): boolean {
    return group.items.some((item) => this.canView(item));
  }

  /** Ends the cookie session, then returns the user to the public login page. */
  protected logout(): void {
    this.loadingLogout = true;
    this.logoutError = '';

    this.auth
      .logout()
      .pipe(finalize(() => (this.loadingLogout = false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/login'),
        error: () => (this.logoutError = this.language.translate('auth.logoutFailed')),
      });
  }

  /** Notifies the layout after a working navigation item is selected. */
  protected selectNavigation(): void {
    this.navigationSelected.emit();
  }
}
