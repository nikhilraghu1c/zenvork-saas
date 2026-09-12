import { InitialsPipe } from '../../../../core/pipes/initials.pipe';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../modules/auth/services/auth.service';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  requiresOwner?: boolean;
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
  protected readonly navigationGroups: NavigationGroup[] = [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' }],
    },
    {
      label: 'Workspace',
      items: [
        { label: 'Booking', icon: 'calendar_month', route: '/app/booking' },
        { label: 'Clients', icon: 'groups', route: '/app/clients' },
        { label: 'Staff', icon: 'badge', route: '/app/staff', requiresOwner: true },
        { label: 'Resources', icon: 'inventory_2', route: '/app/resources', requiresOwner: true },
        { label: 'Reminders', icon: 'notifications', route: '/app/reminders' },
        { label: 'Chat', icon: 'chat', route: '/app/chat' },
        { label: 'AI Assistant', icon: 'auto_awesome', route: '/app/ai-assistant' },
      ],
    },
    {
      label: 'Insights',
      items: [{ label: 'Analytics', icon: 'analytics', route: '/app/analytics' }],
    },
    {
      label: 'Business',
      items: [{ label: 'Settings', icon: 'settings', route: '/app/settings' }],
    },
  ];

  protected loadingLogout = false;
  protected logoutError = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  /** Returns the signed-in user's name, with a safe fallback during startup. */
  protected get userName(): string {
    return this.auth.getCurrentUser()?.name ?? 'Business User';
  }

  /** Hides owner-only workspaces from staff navigation. */
  protected canView(item: NavigationItem): boolean {
    return !item.requiresOwner || this.auth.getCurrentUser()?.role === 'OWNER';
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
