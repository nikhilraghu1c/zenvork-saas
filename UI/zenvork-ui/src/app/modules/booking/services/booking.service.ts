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

/** Chooses which booking timestamp an All bookings calendar date filters. */
export type BookingDateField = 'modified' | 'created' | 'scheduled';

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
  resourceTypeName: string;
}

export interface BookingStatusHistoryEntry {
  status: BookingStatus;
  changedAt: string;
}

/** Server-calculated action visibility; the backend still enforces every mutation. */
export interface BookingCapabilities {
  canManage: boolean;
}

export interface BookingServiceSnapshot {
  serviceId: string;
  name: string;
  pricePaise: number;
  /** Older booking snapshots predate quantities and are treated as one. */
  quantity?: number;
  durationMinutes: number;
  requiresPersonResource: boolean;
}

export type BookingDiscountType = 'none' | 'amount' | 'percentage';

export interface BookingServiceItemRequest {
  serviceId: string;
  quantity: number;
}

export type BookingDiscountRequest =
  | { type: 'none' }
  | { type: 'amount'; amountPaise: number }
  | { type: 'percentage'; percentageBasisPoints: number };

export interface BookingRecord {
  _id: string;
  client: BookingClientSummary | null;
  resources: BookingResourceSummary[];
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  status: BookingStatus;
  hasServices?: boolean;
  services?: BookingServiceSnapshot[];
  extraAmountPaise: number;
  discountType: BookingDiscountType;
  discountValue: number;
  discountAmountPaise: number;
  totalAmountPaise: number;
  paymentStatus: 'unpaid' | 'paid';
  paidAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: BookingStatusHistoryEntry[];
  capabilities?: BookingCapabilities;
}

export interface BookingListQuery extends ApiQuery {
  view?: 'today' | 'all';
  from?: string;
  to?: string;
  search?: string;
  /** Comma-separated lifecycle values; the list API combines them with MongoDB `$in`. */
  status?: string;
  dateField?: BookingDateField;
  resourceId?: string;
  assignment?: 'assigned' | 'unassigned';
  page?: number;
  limit?: number;
}

export interface BookingListResponse {
  bookings: BookingRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/** A lightweight scheduled-booking total for one business-calendar date. */
export interface BookingCalendarDaySummary {
  date: string;
  total: number;
}

export interface BookingCalendarSummaryQuery extends ApiQuery {
  from: string;
  to: string;
  /** Comma-separated lifecycle values; matches the list endpoint's status filter. */
  status?: string;
  resourceId?: string;
}

export interface BookingCalendarSummaryResponse {
  days: BookingCalendarDaySummary[];
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
  serviceItems?: BookingServiceItemRequest[];
  discount?: BookingDiscountRequest;
  extraAmountPaise?: number;
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
  serviceItems?: BookingServiceItemRequest[];
  discount?: BookingDiscountRequest;
  extraAmountPaise?: number;
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

export interface UpdatePaymentStatusRequest {
  paymentStatus: 'unpaid' | 'paid';
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private readonly api: ApiService) {}

  /** Uses a plain GET until staff selects a filter, then sends only active filter parameters. */
  getBookings(query: BookingListQuery = {}): Observable<BookingListResponse> {
    // Ignore unset filter values so they do not create an empty query string.
    const activeQuery = Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    ) as BookingListQuery;

    return Object.keys(activeQuery).length
      ? this.api.query<BookingListResponse>('bookings', activeQuery)
      : this.api.get<BookingListResponse>('bookings');
  }

  /** Returns per-day totals for Month view without transferring each booking record. */
  getCalendarSummary(
    query: BookingCalendarSummaryQuery,
  ): Observable<BookingCalendarSummaryResponse> {
    return this.api.query<BookingCalendarSummaryResponse>('bookings/calendar-summary', query);
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

  updatePaymentStatus(
    id: string,
    payload: UpdatePaymentStatusRequest,
  ): Observable<BookingUpdateResponse> {
    return this.api.patch<BookingUpdateResponse, UpdatePaymentStatusRequest>(
      `bookings/${id}/payment-status`,
      payload,
    );
  }
}
