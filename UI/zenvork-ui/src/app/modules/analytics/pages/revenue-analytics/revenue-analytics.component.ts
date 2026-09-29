import { Component, OnInit, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

import { BusinessDatePipe } from "../../../../core/pipes/business-date.pipe";
import { AppButtonComponent } from "../../../../shared/button/button.component";
import {
  AnalyticsPeriod,
  AnalyticsService,
  RevenueAnalytics,
  ServiceRevenue,
} from "../../services/analytics.service";

@Component({
  selector: "app-revenue-analytics",
  standalone: true,
  imports: [AppButtonComponent, BusinessDatePipe, MatIconModule],
  templateUrl: "./revenue-analytics.component.html",
  styleUrl: "./revenue-analytics.component.scss",
})
export class RevenueAnalyticsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  readonly periods: { value: AnalyticsPeriod; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
  ];

  selectedPeriod: AnalyticsPeriod = "month";
  analytics: RevenueAnalytics | null = null;
  isLoading = true;
  errorMessage = "";

  ngOnInit(): void {
    this.loadRevenue();
  }

  selectPeriod(period: AnalyticsPeriod): void {
    if (period === this.selectedPeriod || this.isLoading) return;

    this.selectedPeriod = period;
    this.loadRevenue();
  }

  get services(): ServiceRevenue[] {
    return this.analytics?.services ?? [];
  }

  get totalServiceRevenuePaise(): number {
    return this.services.reduce((total, service) => total + service.revenuePaise, 0);
  }

  formatMoney(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  comparison(current: number, previous: number): string {
    if (!previous) return current ? "No previous-period comparison" : "No activity in this period";

    const percentage = Math.round(((current - previous) / previous) * 100);
    if (percentage === 0) return "Same as previous period";

    return `${Math.abs(percentage)}% ${percentage > 0 ? "higher" : "lower"} than previous period`;
  }

  private loadRevenue(): void {
    this.isLoading = true;
    this.errorMessage = "";

    this.analyticsService.getRevenue(this.selectedPeriod).subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.isLoading = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.analytics = null;
        this.errorMessage = error.error?.message ?? "Unable to load revenue analytics.";
        this.isLoading = false;
      },
    });
  }
}
