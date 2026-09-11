import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/services/auth.service';
import { DashboardService } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected resourceCount: number | null = null;
  protected staffCount: number | null = null;
  protected resourceError = false;
  protected staffError = false;

  constructor(
    private readonly auth: AuthService,
    private readonly dashboard: DashboardService,
  ) {}

  /** Loads the available tenant-scoped summary data. */
  ngOnInit(): void {
    this.dashboard.getResources().subscribe({
      next: ({ resources }) => (this.resourceCount = resources.length),
      error: () => (this.resourceError = true),
    });

    if (this.auth.getCurrentUser()?.role === 'OWNER') {
      this.dashboard.getStaffUsers().subscribe({
        next: ({ users }) => (this.staffCount = users.length),
        error: () => (this.staffError = true),
      });
    }
  }

  /** Returns the signed-in user's first name for the welcome heading. */
  protected get firstName(): string {
    return this.auth.getCurrentUser()?.name.split(' ')[0] ?? 'there';
  }
}
