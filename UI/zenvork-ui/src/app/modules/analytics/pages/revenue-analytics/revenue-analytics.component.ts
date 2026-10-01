import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MAT_DATE_FORMATS } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";

import { BusinessDatePipe } from "../../../../core/pipes/business-date.pipe";
import { BusinessDateTimeService } from "../../../../core/services/business-date-time.service";
import { AppButtonComponent } from "../../../../shared/button/button.component";
import { AppDatePickerComponent } from "../../../../shared/date-picker/date-picker.component";
import {
  AnalyticsPeriod,
  AnalyticsService,
  RevenueAnalytics,
  ServiceRevenue,
} from "../../services/analytics.service";

const MONTH_PICKER_DATE_FORMATS = {
  parse: { dateInput: { month: "long", year: "numeric" } },
  display: {
    dateInput: { month: "short", year: "numeric" },
    monthYearLabel: { month: "short", year: "numeric" },
    dateA11yLabel: { year: "numeric", month: "long", day: "numeric" },
    monthYearA11yLabel: { month: "long", year: "numeric" },
  },
};

@Component({
  selector: "app-revenue-analytics",
  standalone: true,
  imports: [
    AppButtonComponent,
    AppDatePickerComponent,
    BusinessDatePipe,
    FormsModule,
    MatIconModule,
  ],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MONTH_PICKER_DATE_FORMATS }],
  templateUrl: "./revenue-analytics.component.html",
  styleUrl: "./revenue-analytics.component.scss",
})
export class RevenueAnalyticsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly dateTime = inject(BusinessDateTimeService);

  readonly periods: { value: AnalyticsPeriod; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
  ];

  selectedPeriod: AnalyticsPeriod = "today";
  selectedMonth = this.dateTime.businessMonthInputValue();
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

  isPeriodSelected(period: AnalyticsPeriod): boolean {
    return this.selectedPeriod === period;
  }

  get minimumMonth(): string {
    return this.shiftMonth(this.dateTime.businessMonthInputValue(), -35);
  }

  get maximumMonth(): string {
    return this.dateTime.businessMonthInputValue();
  }

  selectMonth(value: string): void {
    if (this.isLoading || (value === this.selectedMonth && this.selectedPeriod === "month")) return;
    this.selectedMonth = value;
    this.selectedPeriod = "month";
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

    this.analyticsService
      .getRevenue(this.selectedPeriod, this.selectedPeriod === "month" ? this.selectedMonth : undefined)
      .subscribe({
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

  private monthToDate(value: string): Date {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  private shiftMonth(value: string, months: number): string {
    const date = this.monthToDate(value);
    date.setMonth(date.getMonth() + months);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
}
