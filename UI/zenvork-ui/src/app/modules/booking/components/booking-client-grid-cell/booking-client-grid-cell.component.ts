import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { BookingRecord } from '../../services/booking.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-booking-client-grid-cell',
  templateUrl: './booking-client-grid-cell.component.html',
  styleUrl: './booking-client-grid-cell.component.scss',
})
export class BookingClientGridCellComponent implements ICellRendererAngularComp {
  private readonly language = inject(LanguageService);
  protected name = this.language.translate('booking.clientUnavailable');
  protected mobile = this.language.translate('booking.noMobile');
  protected initial = '?';

  /** Receives the populated client record displayed in a booking grid row. */
  agInit(params: ICellRendererParams<BookingRecord>): void {
    this.setClient(params.data);
  }

  /** Refreshes the client details when AG Grid updates the row. */
  refresh(params: ICellRendererParams<BookingRecord>): boolean {
    this.setClient(params.data);
    return true;
  }

  /** Builds safe visual fallbacks when a historical booking has no populated client. */
  private setClient(booking: BookingRecord | undefined): void {
    this.name = booking?.client?.name ?? this.language.translate('booking.clientUnavailable');
    this.mobile = booking?.client?.mobile ?? this.language.translate('booking.noMobile');
    this.initial = this.name.trim().charAt(0).toUpperCase() || '?';
  }
}
