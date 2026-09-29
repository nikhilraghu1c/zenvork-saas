import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";

import { ApiService } from "../../../core/services/api.service";

export type AnalyticsPeriod = "today" | "week" | "month";

export interface RevenueDailyTotal {
  date: string;
  billedPaise: number;
  collectedPaise: number;
}

export interface ServiceRevenue {
  serviceId: string;
  name: string;
  revenuePaise: number;
  bookingsCount: number;
}

export interface RevenueAnalytics {
  period: AnalyticsPeriod;
  range: { from: string; to: string };
  revenue: {
    billedPaise: number;
    billedBookingsCount: number;
    previousBilledPaise: number;
    collectedPaise: number;
    collectedBookingsCount: number;
    previousCollectedPaise: number;
    outstandingPaise: number;
    outstandingBookingsCount: number;
    extraChargesPaise: number;
  };
  daily: RevenueDailyTotal[];
  services: ServiceRevenue[];
}

@Injectable({ providedIn: "root" })
export class AnalyticsService {
  private readonly api = inject(ApiService);

  getRevenue(period: AnalyticsPeriod): Observable<RevenueAnalytics> {
    return this.api
      .query<{ analytics: RevenueAnalytics }>("analytics/revenue", { period })
      .pipe(map((response) => response.analytics));
  }
}
