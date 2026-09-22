import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AppButtonComponent } from '../../shared/button/button.component';
import { AuthService } from '../auth/services/auth.service';
import { DashboardPeriod, DashboardService, DashboardSummary } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, MatIconModule, AppButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected summary: DashboardSummary | null = null;
  protected selectedPeriod: DashboardPeriod = 'today';
  protected readonly periods: DashboardPeriod[] = ['today', 'week', 'month'];
  protected loading = true;
  protected errorMessage = '';

  constructor(
    private readonly auth: AuthService,
    private readonly dashboard: DashboardService,
  ) {}

  /** Loads the dashboard's server-calculated tenant-scoped metrics. */
  ngOnInit(): void {
    this.loadSummary();
  }

  /** Changes the comparison window without retaining stale tenant figures. */
  protected selectPeriod(period: DashboardPeriod): void {
    if (period === this.selectedPeriod) return;
    this.selectedPeriod = period;
    this.loadSummary();
  }

  /** Returns the signed-in user's first name for the welcome heading. */
  protected get firstName(): string {
    return this.auth.getCurrentUser()?.name.split(' ')[0] ?? 'there';
  }

  protected get periodLabel(): string {
    return this.selectedPeriod === 'today'
      ? 'Today'
      : this.selectedPeriod === 'week'
        ? 'This week'
        : 'This month';
  }

  /** Formats server-stored paise for display without relying on client totals. */
  protected formatMoney(paise: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(paise / 100);
  }

  /** Gives the comparison a useful label when the preceding period has no revenue. */
  protected revenueComparison(): string {
    if (!this.summary) return '';
    const { earnedPaise, previousEarnedPaise } = this.summary.revenue;
    if (previousEarnedPaise === 0)
      return earnedPaise > 0 ? 'New revenue in this period' : 'No revenue yet';
    const change = Math.round(((earnedPaise - previousEarnedPaise) / previousEarnedPaise) * 100);
    return `${change >= 0 ? '+' : ''}${change}% vs previous ${this.selectedPeriod}`;
  }

  private loadSummary(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dashboard.getSummary(this.selectedPeriod).subscribe({
      next: ({ summary }) => {
        this.summary = summary;
        this.loading = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.summary = null;
        this.loading = false;
        this.errorMessage = error.error?.message ?? 'Unable to load dashboard data';
      },
    });
  }
}
