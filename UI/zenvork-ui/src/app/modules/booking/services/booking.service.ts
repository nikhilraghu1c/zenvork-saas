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
  email?: string;
}

export interface BookingResourceSummary {
  _id: string;
  name: string;
  resourceType: string;
}

export interface BookingStatusHistoryEntry {
  status: BookingStatus;
  changedAt: string;
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
  statusHistory?: BookingStatusHistoryEntry[];
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

export interface BookingDetailResponse {
  booking: BookingRecord;
}

export interface CreateBookingRequest {
  clientId?: string;
  client?: { name: string; mobile: string; email?: string };
  resourceIds: string[];
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  notes?: string;
}

export interface CreateBookingResponse {
  message: string;
  bookingId: string;
}

export interface UpdateBookingRequest {
  clientId?: string;
  resourceIds?: string[];
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  notes?: string;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  /** Required by the backend for CHECKED_IN and rejected for other status transitions. */
  resourceIds?: string[];
}

export interface BookingUpdateResponse {
  message: string;
  booking: BookingRecord;
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

  /** Loads one tenant-owned booking for its staff-facing detail workspace. */
  getBooking(id: string): Observable<BookingDetailResponse> {
    return this.api.get<BookingDetailResponse>(`bookings/${id}`);
  }

  /** Creates either a pending or scheduled booking for the authenticated business. */
  createBooking(payload: CreateBookingRequest): Observable<CreateBookingResponse> {
    return this.api.post<CreateBookingResponse, CreateBookingRequest>('bookings', payload);
  }

  /** Edits permitted booking details, including first scheduling and later rescheduling. */
  updateBooking(id: string, payload: UpdateBookingRequest): Observable<BookingUpdateResponse> {
    return this.api.patch<BookingUpdateResponse, UpdateBookingRequest>(`bookings/${id}`, payload);
  }

  /** Applies a lifecycle transition while the backend records the actual UTC service timestamps. */
  updateBookingStatus(
    id: string,
    payload: UpdateBookingStatusRequest,
  ): Observable<BookingUpdateResponse> {
    return this.api.patch<BookingUpdateResponse, UpdateBookingStatusRequest>(
      `bookings/${id}/status`,
      payload,
    );
  }
}
