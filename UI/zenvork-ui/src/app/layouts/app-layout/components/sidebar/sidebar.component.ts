import { InitialsPipe } from '../../../../core/pipes/initials.pipe';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../modules/auth/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  requiresOwner?: boolean;
  requiresReminderAccess?: boolean;
}

interface NavigationGroup {
  label: string;
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
      label: 'Overview',
      items: [{ label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' }],
    },
    {
      label: 'Workspace',
      items: [
        { label: 'Booking', icon: 'calendar_month', route: '/app/booking' },
        { label: 'Clients', icon: 'groups', route: '/app/clients', requiresOwner: true },
        { label: 'Staff', icon: 'badge', route: '/app/staff', requiresOwner: true },
        { label: 'Resources', icon: 'inventory_2', route: '/app/resources' },
        { label: 'Services', icon: 'miscellaneous_services', route: '/app/services' },
        {
          label: 'Reminders',
          icon: 'notifications',
          route: '/app/reminders',
          requiresReminderAccess: true,
        },
        { label: 'AI Assistant', icon: 'auto_awesome', route: '/app/ai-assistant' },
      ],
    },
    {
      label: 'Insights',
      items: [
        { label: 'Analytics', icon: 'analytics', route: '/app/analytics', requiresOwner: true },
      ],
    },
    {
      label: 'Business',
      items: [{ label: 'Settings', icon: 'settings', route: '/app/settings' }],
    },
  ];

  private readonly adminNavigationGroups: NavigationGroup[] = [
    {
      label: 'Platform',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
        { label: 'Businesses', icon: 'business', route: '/admin/businesses' },
        { label: 'Business Types', icon: 'category', route: '/admin/business-types' },
        { label: 'Resource Types', icon: 'inventory_2', route: '/admin/resource-types' },
        { label: 'Settings', icon: 'settings', route: '/admin/settings' },
      ],
    },
  ];

  protected loadingLogout = false;
  protected logoutError = '';
  protected readonly theme = inject(ThemeService);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  /** Returns the signed-in user's name, with a safe fallback during startup. */
  protected get userName(): string {
    return this.auth.getCurrentUser()?.name ?? 'Business User';
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
      return 'Platform Admin';
    }
    return user?.businessName ?? 'Your Business';
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
        error: () => (this.logoutError = 'Unable to log out. Please try again.'),
      });
  }

  /** Notifies the layout after a working navigation item is selected. */
  protected selectNavigation(): void {
    this.navigationSelected.emit();
  }
}
