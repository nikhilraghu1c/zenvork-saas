import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AdminDashboardSummary, AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [AppButtonComponent, MatIconModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);
  protected summary: AdminDashboardSummary | null = null;
  protected loading = true;
  protected errorMessage = '';

  ngOnInit(): void {
    this.admin.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load platform overview.';
        this.loading = false;
      },
    });
  }

  protected typePercentage(count: number): number {
    return this.summary?.totalBusinesses
      ? Math.round((count / this.summary.totalBusinesses) * 100)
      : 0;
  }

  /** Cycles a compact, accessible palette as platform administrators add catalogue types. */
  protected distributionColor(index: number): string {
    return ['var(--cyan)', 'var(--purple)', 'var(--azure-light)', 'var(--green)', 'var(--amber)'][
      index % 5
    ];
  }
}
