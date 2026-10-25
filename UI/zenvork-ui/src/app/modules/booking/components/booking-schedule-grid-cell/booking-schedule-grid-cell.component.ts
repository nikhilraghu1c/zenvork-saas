import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { BusinessDateTimeService } from '../../../../core/services/business-date-time.service';
import { BookingRecord } from '../../services/booking.service';

@Component({
  selector: 'app-booking-schedule-grid-cell',
  standalone: true,
  templateUrl: './booking-schedule-grid-cell.component.html',
  styleUrl: './booking-schedule-grid-cell.component.scss',
})
export class BookingScheduleGridCellComponent implements ICellRendererAngularComp {
  private readonly dateTime = inject(BusinessDateTimeService);

  protected startLabel = 'Unscheduled';
  protected endLabel = '';

  /** Renders the stored planned interval; actual timestamps belong on the booking details page. */
  agInit(params: ICellRendererParams<BookingRecord>): void {
    this.setSchedule(params.data);
  }

  /** Refreshes the planned interval whenever AG Grid updates a booking row. */
  refresh(params: ICellRendererParams<BookingRecord>): boolean {
    this.setSchedule(params.data);
    return true;
  }

  private setSchedule(booking: BookingRecord | undefined): void {
    const startAt = booking?.scheduledStartAt;
    const endAt = booking?.scheduledEndAt;
    if (!startAt) {
      this.startLabel = 'Awaiting schedule';
      this.endLabel = '';
      return;
    }

    const startDate = this.dateTime.format(startAt, 'date');
    const startTime = this.dateTime.format(startAt, 'time');
    if (!endAt) {
      this.startLabel = `${startDate} · ${startTime}`;
      this.endLabel = '';
      return;
    }

    const endDate = this.dateTime.format(endAt, 'date');
    const endTime = this.dateTime.format(endAt, 'time');
    if (this.isSameBusinessDay(startAt, endAt)) {
      this.startLabel = startDate;
      this.endLabel = `${startTime} – ${endTime}`;
      return;
    }

    this.startLabel = `${startDate} · ${startTime}`;
    this.endLabel = `→ ${endDate} · ${endTime}`;
  }

  private isSameBusinessDay(startAt: string, endAt: string): boolean {
    const startDate = this.dateTime.businessDateTimeInputValues(startAt)?.date;
    const endDate = this.dateTime.businessDateTimeInputValues(endAt)?.date;
    if (!startDate || !endDate) {
      return true;
    }
    return startDate === endDate;
  }
}
