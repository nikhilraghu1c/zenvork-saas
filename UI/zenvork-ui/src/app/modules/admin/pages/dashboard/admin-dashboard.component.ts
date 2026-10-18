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

  protected countFor(code: string): number {
    return this.summary?.byBusinessType[code] ?? 0;
  }
  protected typePercentage(code: string): number {
    return this.summary?.totalBusinesses
      ? Math.round((this.countFor(code) / this.summary.totalBusinesses) * 100)
      : 0;
  }
}
