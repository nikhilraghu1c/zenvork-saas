import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppFullCalendarComponent } from '../../../../shared/full-calendar/full-calendar.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { BusinessDateTimeService } from '../../../../core/services/business-date-time.service';
import { ResourceService } from '../../../resources/services/resource.service';
import {
  BookingCalendarDaySummary,
  BookingListQuery,
  BookingRecord,
  BookingService,
  BookingStatus,
} from '../../services/booking.service';

type CalendarView = 'day' | 'week' | 'month';

const FULL_CALENDAR_VIEW: Record<CalendarView, string> = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
};

@Component({
  selector: 'app-booking-calendar',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatTooltipModule,
    AppFullCalendarComponent,
    AppButtonComponent,
    AppSelectComponent,
  ],
  templateUrl: './booking-calendar.component.html',
  styleUrl: './booking-calendar.component.scss',
})
export class BookingCalendarComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dateTime = inject(BusinessDateTimeService);
  private readonly resourceService = inject(ResourceService);

  @ViewChild('calendar')
  private calendar?: AppFullCalendarComponent;

  protected calendarView: CalendarView = 'day';
  protected selectedDate = this.dateTime.businessDateInputValue();
  protected readonly statusControl = new FormControl<BookingStatus[]>([], { nonNullable: true });
  protected readonly resourceControl = new FormControl('', { nonNullable: true });
  protected readonly statusOptions: AppSelectOption[] = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CHECKED_IN', label: 'Checked in' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No-show' },
  ];
  protected resourceOptions: AppSelectOption[] = [{ value: '', label: 'All resources' }];
  protected loading = true;
  protected errorMessage = '';
  protected calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridDay',
    headerToolbar: false,
    allDaySlot: false,
    nowIndicator: true,
    navLinks: false,
    selectable: false,
    editable: false,
    eventStartEditable: false,
    eventDurationEditable: false,
    eventDisplay: 'block',
    eventMinHeight: 48,
    slotEventOverlap: false,
    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',
    scrollTime: '08:00:00',
    dayMaxEvents: 3,
    moreLinkText: 'more',
    eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
    eventClick: (click) => this.openBooking(click),
    dateClick: (click) => this.openCalendarDay(click),
    events: [],
  };

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const view = params.get('calendarView');
    this.calendarView = view === 'week' || view === 'month' ? view : 'day';
    const date = params.get('calendarDate');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) this.selectedDate = date;
    this.restoreFilters();
    this.calendarOptions = {
      ...this.calendarOptions,
      initialView: FULL_CALENDAR_VIEW[this.calendarView],
      initialDate: this.selectedDate,
    };
    this.statusControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.persistState();
      this.loadBookings();
    });
    this.resourceControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.persistState();
      this.loadBookings();
    });
    this.loadResourceOptions();
    this.loadBookings();
  }

  protected get title(): string {
    if (this.calendarView === 'day') return this.dateTime.format(this.selectedDate, 'date');
    if (this.calendarView === 'week') {
      const start = this.weekStart(this.selectedDate);
      const end = this.addDays(start, 6);
      return `${this.dateTime.format(start, 'monthDay')} – ${this.dateTime.format(end, 'monthDay')}`;
    }
    return this.dateTime.format(this.selectedDate, 'monthYear');
  }

  protected setCalendarView(view: CalendarView): void {
    if (this.calendarView === view) return;
    this.calendarView = view;
    this.syncCalendarOptions();
    this.updateCalendarView();
    this.persistState();
    this.loadBookings();
  }

  protected movePeriod(direction: -1 | 1): void {
    const next = this.dateFromValue(this.selectedDate);
    if (this.calendarView === 'day') next.setUTCDate(next.getUTCDate() + direction);
    if (this.calendarView === 'week') next.setUTCDate(next.getUTCDate() + direction * 7);
    if (this.calendarView === 'month') next.setUTCMonth(next.getUTCMonth() + direction);
    this.selectedDate = this.dateValue(next);
    this.syncCalendarOptions();
    this.updateCalendarView();
    this.persistState();
    this.loadBookings();
  }

  protected goToToday(): void {
    this.selectedDate = this.dateTime.businessDateInputValue();
    this.syncCalendarOptions();
    this.updateCalendarView();
    this.persistState();
    this.loadBookings();
  }

  private loadBookings(): void {
    this.loading = true;
    this.errorMessage = '';
    if (this.calendarView === 'month') {
      this.loadMonthSummary();
      return;
    }
    const { from, to } = this.rangeForActiveView();
    const query: BookingListQuery = {
      view: 'all',
      dateField: 'scheduled',
      from,
      to,
      page: 1,
      limit: 10000,
    };
    if (this.statusControl.value.length) query.status = this.statusControl.value.join(',');
    if (this.resourceControl.value) query.resourceId = this.resourceControl.value;
    this.bookingService
      .getBookings(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ bookings }) => {
          this.setCalendarEvents(bookings.filter((booking) => booking.scheduledStartAt));
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load calendar bookings.';
          this.loading = false;
        },
      });
  }

  /** Month stays performant by rendering one lightweight total per calendar date. */
  private loadMonthSummary(): void {
    const { from, to } = this.rangeForActiveView();
    const query = {
      from,
      to,
      ...(this.statusControl.value.length && { status: this.statusControl.value.join(',') }),
      ...(this.resourceControl.value && { resourceId: this.resourceControl.value }),
    };
    this.bookingService
      .getCalendarSummary(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ days }) => {
          this.setMonthSummaryEvents(days);
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load calendar bookings.';
          this.loading = false;
        },
      });
  }

  /** Maps tenant booking records into FullCalendar inputs while keeping original details for the click flow. */
  private setCalendarEvents(bookings: BookingRecord[]): void {
    const events: EventInput[] = bookings.map((booking) => ({
      id: booking._id,
      title: `${booking.client?.name ?? 'Client unavailable'} · ${this.resourceLabel(booking)}`,
      start: this.businessWallTime(booking.scheduledStartAt!),
      end: booking.scheduledEndAt ? this.businessWallTime(booking.scheduledEndAt) : undefined,
      classNames: [`booking-event--${booking.status.toLowerCase()}`],
      extendedProps: {
        bookingId: booking._id,
      },
    }));
    this.calendarOptions = { ...this.calendarOptions, events };
  }

  private setMonthSummaryEvents(days: BookingCalendarDaySummary[]): void {
    const events: EventInput[] = days.map((day) => ({
      id: `summary-${day.date}`,
      title: `${day.total} ${day.total === 1 ? 'booking' : 'bookings'}`,
      start: day.date,
      allDay: true,
      classNames: ['booking-summary-event'],
      extendedProps: { summaryDate: day.date },
    }));
    this.calendarOptions = { ...this.calendarOptions, events };
  }

  private openBooking(click: EventClickArg): void {
    click.jsEvent.preventDefault();
    const summaryDate = click.event.extendedProps['summaryDate'] as string | undefined;
    if (summaryDate) {
      this.openDay(summaryDate);
      return;
    }
    const bookingId = click.event.extendedProps['bookingId'] as string;
    void this.router.navigate(['/app/booking', bookingId], { queryParamsHandling: 'preserve' });
  }

  /** A date cell is a shortcut into the operational day schedule, not a separate route. */
  private openCalendarDay(click: DateClickArg): void {
    if (this.calendarView === 'day') return;
    this.openDay(click.dateStr.slice(0, 10));
  }

  private openDay(date: string): void {
    this.calendarView = 'day';
    this.selectedDate = date;
    this.syncCalendarOptions();
    this.updateCalendarView();
    this.persistState();
    this.loadBookings();
  }

  private updateCalendarView(): void {
    const api = this.calendar?.getApi();
    if (!api) return;
    api.changeView(FULL_CALENDAR_VIEW[this.calendarView]);
    api.gotoDate(this.selectedDate);
  }

  /** Keep Angular's option binding aligned with imperative navigation after event data refreshes. */
  private syncCalendarOptions(): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      initialView: FULL_CALENDAR_VIEW[this.calendarView],
      initialDate: this.selectedDate,
    };
  }

  private rangeForActiveView(): { from: string; to: string } {
    if (this.calendarView === 'day') return this.dateTime.businessDayRange(this.selectedDate);
    if (this.calendarView === 'week') {
      const start = this.dateValue(this.weekStart(this.selectedDate));
      const end = this.dateValue(this.addDays(this.weekStart(this.selectedDate), 7));
      return {
        from: this.dateTime.businessDayRange(start).from,
        to: this.dateTime.businessDayRange(end).from,
      };
    }
    const selected = this.dateFromValue(this.selectedDate);
    const start = this.dateValue(new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1)));
    const end = this.dateValue(
      new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() + 1, 1)),
    );
    return {
      from: this.dateTime.businessDayRange(start).from,
      to: this.dateTime.businessDayRange(end).from,
    };
  }

  private persistState(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        calendarView: this.calendarView === 'day' ? null : this.calendarView,
        calendarDate: this.selectedDate,
        calendarStatus: this.statusControl.value.length ? this.statusControl.value.join(',') : null,
        calendarResource: this.resourceControl.value || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Restores calendar-only filters without affecting preserved list-page query state. */
  private restoreFilters(): void {
    const params = this.route.snapshot.queryParamMap;
    const validStatuses = this.statusOptions
      .map((option) => option.value as BookingStatus)
      .filter((status) => (params.get('calendarStatus') ?? '').split(',').includes(status));
    this.statusControl.setValue(validStatuses, { emitEvent: false });
    this.resourceControl.setValue(params.get('calendarResource') ?? '', { emitEvent: false });
  }

  /** Keeps resource filtering tenant-scoped and hides inactive records from future scheduling views. */
  private loadResourceOptions(): void {
    this.resourceService
      .getResources()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ resources }) => {
          this.resourceOptions = [
            { value: '', label: 'All resources' },
            ...resources
              .filter((resource) => resource.isActive)
              .map((resource) => ({ value: resource._id, label: resource.name })),
          ];
        },
        error: () => {
          // Calendar remains usable when the optional resource filter cannot load.
          this.resourceOptions = [{ value: '', label: 'All resources' }];
        },
      });
  }

  private resourceLabel(booking: BookingRecord): string {
    return booking.resources.length ? booking.resources.map((resource) => resource.name).join(', ') : 'Unassigned';
  }

  /** FullCalendar receives business-local wall times so browser timezones cannot shift appointments. */
  private businessWallTime(value: string): string {
    const parts = this.dateTime.businessDateTimeInputValues(value);
    return parts ? `${parts.date}T${parts.time}:00` : value;
  }

  private weekStart(value: string): Date {
    const date = this.dateFromValue(value);
    return this.addDays(date, -((date.getUTCDay() + 6) % 7));
  }

  private dateFromValue(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private dateValue(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
  }
}
