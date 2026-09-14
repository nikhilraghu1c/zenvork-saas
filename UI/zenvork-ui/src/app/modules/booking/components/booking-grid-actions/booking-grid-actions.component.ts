import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { BookingRecord } from '../../services/booking.service';

@Component({
  selector: 'app-booking-grid-actions',
  imports: [AppActionMenuComponent],
  templateUrl: './booking-grid-actions.component.html',
  styleUrl: './booking-grid-actions.component.scss',
})
export class BookingGridActionsComponent implements ICellRendererAngularComp {
  private readonly router = inject(Router);
  protected booking!: BookingRecord;
  protected readonly actions: AppActionMenuItem[] = [{ id: 'details', label: 'Details', icon: 'visibility' }];

  /** Receives the booking record rendered by this desktop grid action cell. */
  agInit(params: ICellRendererParams<BookingRecord>): void {
    this.booking = params.data!;
  }

  /** Refreshes the booking record when AG Grid updates the current row. */
  refresh(params: ICellRendererParams<BookingRecord>): boolean {
    this.booking = params.data!;
    return true;
  }

  /** Opens the selected booking detail workspace. */
  protected handleAction(actionId: string): void {
    if (actionId === 'details') void this.router.navigate(['/app/booking', this.booking._id]);
  }
}
