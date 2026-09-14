import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { BookingRecord, BookingStatus } from '../../services/booking.service';

@Component({
  selector: 'app-booking-status-grid-cell',
  templateUrl: './booking-status-grid-cell.component.html',
  styleUrl: './booking-status-grid-cell.component.scss',
})
export class BookingStatusGridCellComponent implements ICellRendererAngularComp {
  protected status: BookingStatus = 'PENDING';

  /** Receives the booking lifecycle status displayed in a booking grid row. */
  agInit(params: ICellRendererParams<BookingRecord>): void {
    this.status = params.data?.status ?? 'PENDING';
  }

  /** Refreshes the lifecycle status when AG Grid updates the row. */
  refresh(params: ICellRendererParams<BookingRecord>): boolean {
    this.status = params.data?.status ?? 'PENDING';
    return true;
  }

  /** Maps stored status values to short staff-facing labels. */
  protected statusLabel(): string {
    return this.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
