import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { BookingRecord, BookingStatus } from '../../services/booking.service';

type BookingStatusUpdateHandler = (bookingId: string, status: BookingStatus) => void;
type OpenCheckInHandler = (booking: BookingRecord) => void;

@Component({
  selector: 'app-booking-grid-actions',
  imports: [AppActionMenuComponent],
  templateUrl: './booking-grid-actions.component.html',
  styleUrl: './booking-grid-actions.component.scss',
})
export class BookingGridActionsComponent implements ICellRendererAngularComp {
  private readonly router = inject(Router);
  private params!: ICellRendererParams<BookingRecord>;
  protected booking!: BookingRecord;
  protected actions: AppActionMenuItem[] = [];

  /** Receives the booking record rendered by this desktop grid action cell. */
  agInit(params: ICellRendererParams<BookingRecord>): void {
    this.setBooking(params);
  }

  /** Refreshes the booking record when AG Grid updates the current row. */
  refresh(params: ICellRendererParams<BookingRecord>): boolean {
    this.setBooking(params);
    return true;
  }

  /** Opens details or delegates a valid lifecycle action to the owning booking list. */
  protected handleAction(actionId: string): void {
    if (actionId === 'details') {
      void this.router.navigate(['/app/booking', this.booking._id]);
      return;
    }

    const status = actionId.replace('status:', '') as BookingStatus;
    if (status === 'CHECKED_IN') {
      const openCheckIn = this.params.context?.['openCheckIn'] as OpenCheckInHandler | undefined;
      openCheckIn?.(this.booking);
      return;
    }
    const handler = this.params.context?.['updateBookingStatus'] as BookingStatusUpdateHandler | undefined;
    handler?.(this.booking._id, status);
  }

  private setBooking(params: ICellRendererParams<BookingRecord>): void {
    this.params = params;
    this.booking = params.data!;
    this.actions = [
      { id: 'details', label: 'Details', icon: 'visibility' },
      ...this.statusActions(this.booking.status),
    ];
  }

  private statusActions(status: BookingStatus): AppActionMenuItem[] {
    if (status === 'CHECKED_IN') {
      return [{ id: 'status:COMPLETED', label: 'Mark completed', icon: 'task_alt' }];
    }
    if (status === 'PENDING' || status === 'SCHEDULED') {
      return [
        { id: 'status:CHECKED_IN', label: 'Check in', icon: 'login' },
        { id: 'status:NO_SHOW', label: 'Mark no-show', icon: 'person_off' },
        { id: 'status:CANCELLED', label: 'Cancel booking', icon: 'cancel' },
      ];
    }
    return [];
  }
}
