import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiQuery, ApiService } from '../../../core/services/api.service';

export type BookingStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface BookingClientSummary {
  _id: string;
  name: string;
  mobile: string;
}

export interface BookingResourceSummary {
  _id: string;
  name: string;
  resourceType: string;
}

export interface BookingRecord {
  _id: string;
  client: BookingClientSummary | null;
  resources: BookingResourceSummary[];
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  status: BookingStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingListQuery extends ApiQuery {
  from?: string;
  to?: string;
  status?: BookingStatus;
  resourceId?: string;
  assignment?: 'assigned' | 'unassigned';
  sortBy?: 'scheduledStartAt' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface BookingListResponse {
  bookings: BookingRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private readonly api: ApiService) {}

  /** Uses a plain GET until staff selects a filter, then sends only active filter parameters. */
  getBookings(query: BookingListQuery = {}): Observable<BookingListResponse> {
    // Ignore unset filter values so they do not create an empty query string.
    const activeQuery = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ) as BookingListQuery;

    return Object.keys(activeQuery).length
      ? this.api.query<BookingListResponse>('bookings', activeQuery)
      : this.api.get<BookingListResponse>('bookings');
  }
}
