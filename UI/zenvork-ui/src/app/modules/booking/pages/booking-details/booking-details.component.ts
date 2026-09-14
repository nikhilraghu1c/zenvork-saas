import { InitialsPipe } from '../../../../core/pipes/initials.pipe';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { BookingRecord, BookingService, BookingStatus } from '../../services/booking.service';

interface TimelineStep {
  label: string;
  timestamp: string | null;
  state: 'done' | 'current' | 'upcoming';
}

@Component({
  selector: 'app-booking-details',
  imports: [InitialsPipe, RouterLink, MatIconModule, AppButtonComponent],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.scss',
})
export class BookingDetailsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected booking: BookingRecord | null = null;
  protected loading = true;
  protected errorMessage = '';

  /** Loads one booking directly so details remain correct beyond the currently listed page. */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Booking not found.';
      this.loading = false;
      return;
    }

    this.bookingService
      .getBooking(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ booking }) => {
          this.booking = booking;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load booking details.';
          this.loading = false;
        },
      });
  }

  /** Formats stored UTC timestamps for the India-focused business display. */
  protected formatDateTime(value: string | null): string {
    if (!value) return 'Not recorded';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(new Date(value))
      .toUpperCase();
  }

  /** Builds a compact planned slot without showing an artificial end time for pending work. */
  protected scheduleLabel(booking: BookingRecord): string {
    if (!booking.scheduledStartAt) return 'Awaiting schedule';
    const start = this.formatDateTime(booking.scheduledStartAt);
    if (!booking.scheduledEndAt) return start;
    return `${start} – ${new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(new Date(booking.scheduledEndAt))
      .toUpperCase()}`;
  }

  /** Maps stored lifecycle values to concise staff-facing labels. */
  protected statusLabel(status: BookingStatus): string {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  /** Shows only timestamps the current schema can verify; future states remain visibly pending. */
  protected timeline(booking: BookingRecord): TimelineStep[] {
    const terminal = booking.status === 'CANCELLED' || booking.status === 'NO_SHOW';
    return [
      { label: 'Created', timestamp: booking.createdAt, state: 'done' },
      {
        label: 'Scheduled',
        timestamp: booking.scheduledStartAt,
        state: booking.scheduledStartAt ? 'done' : booking.status === 'PENDING' ? 'current' : 'upcoming',
      },
      {
        label: 'Checked in',
        timestamp: booking.actualStartAt,
        state: booking.actualStartAt ? 'done' : booking.status === 'CHECKED_IN' ? 'current' : 'upcoming',
      },
      {
        label: terminal ? this.statusLabel(booking.status) : 'Completed',
        timestamp: terminal ? booking.updatedAt : booking.actualEndAt,
        state: terminal || booking.actualEndAt ? 'current' : 'upcoming',
      },
    ];
  }
}
