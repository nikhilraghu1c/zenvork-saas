import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export type DashboardPeriod = 'today' | 'week' | 'month';

export interface DashboardTopService {
  serviceId: string;
  name: string;
  revenuePaise: number;
  bookingsCount: number;
}

export interface DashboardTopStaffMember {
  resourceId: string;
  name: string;
  resourceType: string;
  bookingsCount: number;
}

export interface DashboardSummary {
  period: DashboardPeriod;
  range: { from: string; to: string };
  bookingsCount: number;
  revenue: {
    earnedPaise: number;
    previousEarnedPaise: number;
    collectedPaise: number;
    outstandingPaise: number;
  };
  noShows: { count: number; resolvedBookings: number; rate: number };
  activeStaffCount: number;
  topServices: DashboardTopService[];
  topStaff: DashboardTopStaffMember[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly api: ApiService) {}

  /** Loads operational metrics derived from authenticated-tenant bookings and resources. */
  getSummary(period: DashboardPeriod): Observable<{ summary: DashboardSummary }> {
    return this.api.query<{ summary: DashboardSummary }>('dashboard/summary', { period });
  }
}
