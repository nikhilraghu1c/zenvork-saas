import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { AppDataGridComponent } from '../../../../shared/data-grid/data-grid.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AppDatePickerComponent } from '../../../../shared/date-picker/date-picker.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { BookingClientGridCellComponent } from '../../components/booking-client-grid-cell/booking-client-grid-cell.component';
import { BookingCheckInDialogComponent } from '../../components/booking-check-in-dialog/booking-check-in-dialog.component';
import { BookingGridActionsComponent } from '../../components/booking-grid-actions/booking-grid-actions.component';
import { BookingStatusGridCellComponent } from '../../components/booking-status-grid-cell/booking-status-grid-cell.component';
import { BusinessDateTimeService } from '../../../../core/services/business-date-time.service';
import { ResourceRecord, ResourceService } from '../../../resources/services/resource.service';
import {
  BookingListQuery,
  BookingRecord,
  BookingService,
  BookingStatus,
} from '../../services/booking.service';

type BookingStatusFilter = 'ALL' | BookingStatus;
type BookingListView = 'TODAY' | 'ALL';

interface StatusFilterOption extends AppSelectOption {
  value: BookingStatusFilter;
}

@Component({
  selector: 'app-booking-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    AppActionMenuComponent,
    AppButtonComponent,
    AppDataGridComponent,
    AppInputComponent,
    AppDatePickerComponent,
    AppSelectComponent,
    BookingCheckInDialogComponent,
  ],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss',
})
export class BookingListComponent implements OnInit, OnDestroy {
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly resourceService = inject(ResourceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dateTime = inject(BusinessDateTimeService);

  /** Today's work is the default operational view; all bookings remains a full activity history. */
  protected readonly viewControl = new FormControl<BookingListView>('TODAY', {
    nonNullable: true,
  });
  protected readonly statusControl = new FormControl<BookingStatusFilter>('ALL', {
    nonNullable: true,
  });
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly updatedDateControl = new FormControl('', { nonNullable: true });
  protected readonly resourceControl = new FormControl('', { nonNullable: true });
  protected readonly statusFilters: StatusFilterOption[] = [
    { value: 'ALL', label: 'All bookings' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CHECKED_IN', label: 'Checked in' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No-show' },
  ];

  protected resourceOptions: AppSelectOption[] = [{ value: '', label: 'All resources' }];
  protected readonly personResourceIds = new Set<string>();
  protected bookings: BookingRecord[] = [];
  protected totalBookings = 0;
  protected loading = true;
  protected loadingMore = false;
  protected errorMessage = '';
  protected checkInBooking: BookingRecord | null = null;
  /** Lets the grid's action renderer refresh this feature-owned tenant list after an action. */
  protected readonly gridContext = {
    updateBookingStatus: (bookingId: string, status: BookingStatus) =>
      this.updateBookingStatus(bookingId, status),
    updatePaymentStatus: (bookingId: string, paymentStatus: 'unpaid' | 'paid') =>
      this.updatePaymentStatus(bookingId, paymentStatus),
    openCheckIn: (booking: BookingRecord) => (this.checkInBooking = booking),
  };
  protected currentPage = 1;
  protected readonly pageSize = 20;
  private mobileLoadObserver: IntersectionObserver | null = null;

  /** Defines the staff-oriented desktop grid for the active lifecycle view. */
  protected columnDefs: ColDef<BookingRecord>[] = this.createColumnDefs();

  @ViewChild('mobileLoadMore')
  set mobileLoadMore(element: ElementRef<HTMLElement> | undefined) {
    this.observeMobileLoadMore(element?.nativeElement);
  }

  private createColumnDefs(): ColDef<BookingRecord>[] {
    return [
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 112,
      maxWidth: 126,
      cellRenderer: BookingStatusGridCellComponent,
    },
    {
      field: 'client',
      headerName: 'Client',
      minWidth: 180,
      flex: 1.1,
      cellRenderer: BookingClientGridCellComponent,
    },
    {
      field: 'scheduledStartAt',
      headerName: 'Date',
      minWidth: 142,
      flex: 0.9,
      valueFormatter: ({ data }) => this.formatDate(this.appointmentAt(data)),
    },
    {
      field: 'scheduledStartAt',
      headerName: 'Time',
      minWidth: 142,
      flex: 0.9,
      valueFormatter: ({ data }) => (data ? this.bookingTimeLabel(data) : '—'),
    },
    {
      field: 'updatedAt',
      headerName: 'Modified',
      minWidth: 138,
      flex: 0.85,
      valueFormatter: ({ data }) => this.formatDate(this.activityAt(data)),
    },
    {
      field: 'resources',
      headerName: 'Assigned resources',
      minWidth: 190,
      flex: 1.15,
      valueFormatter: ({ data }) => (data ? this.resourceLabel(data) : 'Unassigned'),
      cellStyle: ({ data }) => ({
        color: data?.resources.length ? 'var(--text-dim)' : 'var(--text-mute)',
        fontStyle: data?.resources.length ? 'normal' : 'italic',
      }),
    },
    {
      field: 'totalAmountPaise',
      headerName: 'Bill',
      minWidth: 104,
      maxWidth: 120,
      valueFormatter: ({ value }) => this.formatAmount(Number(value ?? 0)),
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment',
      minWidth: 96,
      maxWidth: 108,
      valueFormatter: ({ data }) =>
        data?.status === 'COMPLETED' ? (data.paymentStatus === 'paid' ? 'Paid' : 'Unpaid') : '—',
      cellStyle: ({ data }) => ({
        color:
          data?.status === 'COMPLETED'
            ? data.paymentStatus === 'paid'
              ? 'var(--green)'
              : 'var(--amber)'
            : 'var(--text-mute)',
        fontWeight: data?.status === 'COMPLETED' ? '600' : '400',
      }),
    },
    {
      headerName: 'Actions',
      cellRenderer: BookingGridActionsComponent,
      sortable: false,
      resizable: false,
      pinned: 'right',
      lockPinned: true,
      minWidth: 96,
      maxWidth: 96,
    },
    ];
  }

  /** Loads filters and refreshes the list whenever a list control changes. */
  ngOnInit(): void {
    this.restoreListState();
    [this.viewControl, this.statusControl, this.updatedDateControl, this.resourceControl].forEach((control) =>
      control.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.persistListState();
          this.resetAndLoadBookings();
        }),
    );
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.persistListState();
        this.resetAndLoadBookings();
      });

    this.resourceService
      .getResources()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ resources }) => this.setResourceOptions(resources),
        error: () => {
          // Booking data remains available even if the optional resource filter cannot load.
          this.resourceOptions = [{ value: '', label: 'All resources' }];
        },
      });

    this.loadBookings();
  }

  ngOnDestroy(): void {
    this.mobileLoadObserver?.disconnect();
  }

  protected get isTodayView(): boolean {
    return this.viewControl.value === 'TODAY';
  }

  protected get hasNextPage(): boolean {
    return this.currentPage * this.pageSize < this.totalBookings;
  }

  protected get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  protected get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalBookings / this.pageSize));
  }

  /** Switches between the operational daily feed and the full booking history. */
  protected setView(view: BookingListView): void {
    if (this.viewControl.value !== view) this.viewControl.setValue(view);
  }

  /** Converts UTC booking timestamps to the shared business display timezone. */
  protected formatTime(value: string | null): string {
    return this.dateTime.format(value, 'time');
  }

  /** Formats lifecycle dates in the business timezone so staff see the business calendar day. */
  protected formatDate(value: string | null): string {
    return value ? this.dateTime.format(value, 'date') : 'Unscheduled';
  }

  /** Both list views are ordered by the latest meaningful booking update. */
  protected activityAt(booking: BookingRecord | undefined): string | null {
    return booking?.updatedAt ?? null;
  }

  /** Shows planned timing before check-in and recorded timing once work has started. */
  protected appointmentAt(booking: BookingRecord | undefined): string | null {
    if (!booking) return null;

    return booking.status === 'CHECKED_IN' || booking.status === 'COMPLETED'
      ? booking.actualStartAt ?? booking.scheduledStartAt
      : booking.scheduledStartAt;
  }

  /** Displays the relevant planned or actual time range for the booking lifecycle state. */
  protected bookingTimeLabel(booking: BookingRecord): string {
    const startAt = this.appointmentAt(booking);
    if (!startAt) return 'Awaiting schedule';

    const start = this.formatTime(startAt);
    const endAt =
      booking.status === 'COMPLETED'
        ? booking.actualEndAt
        : booking.status === 'SCHEDULED' || booking.status === 'CANCELLED' || booking.status === 'NO_SHOW'
          ? booking.scheduledEndAt
          : null;

    return endAt ? `${start} – ${this.formatTime(endAt)}` : start;
  }

  /** Keeps the booking date short enough to share a mobile row with the appointment time. */
  protected formatMobileAppointmentDate(booking: BookingRecord): string {
    const appointmentAt = this.appointmentAt(booking);
    return appointmentAt ? this.dateTime.format(appointmentAt, 'compactDate') : 'Unscheduled';
  }

  protected todayLabel(): string {
    return this.dateTime.format(new Date(), 'date');
  }

  /** Returns assigned resources generically without assuming salon-only resource types. */
  protected resourceLabel(booking: BookingRecord): string {
    return booking.resources.length
      ? booking.resources.map((resource) => resource.name).join(', ')
      : 'Unassigned';
  }

  protected formatAmount(amountPaise: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amountPaise / 100);
  }

  /** Creates a readable one-letter fallback for each client avatar. */
  protected clientInitial(booking: BookingRecord): string {
    return booking.client?.name.trim().charAt(0).toUpperCase() || '?';
  }

  /** Uses the configured resource type to distinguish people from spaces and equipment. */
  protected resourceIcon(resourceId: string): string {
    return this.personResourceIds.has(resourceId) ? 'person' : 'category';
  }

  /** Maps stored lifecycle values to concise staff-facing labels. */
  protected statusLabel(status: BookingStatus): string {
    return status
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  /** Mirrors desktop lifecycle options in the mobile card menu. */
  protected statusActions(booking: BookingRecord): AppActionMenuItem[] {
    const editAction = ['PENDING', 'SCHEDULED', 'CHECKED_IN'].includes(booking.status)
      ? [{ id: 'edit', label: 'Edit booking', icon: 'edit' }]
      : [];
    if (booking.status === 'CHECKED_IN') {
      return [
        ...editAction,
        booking.hasServices
          ? { id: 'COMPLETED', label: 'Mark completed', icon: 'task_alt' }
          : { id: 'add-services', label: 'Add services', icon: 'add' },
      ];
    }
    if (booking.status === 'COMPLETED') {
      return [
        {
          id: `payment:${booking.paymentStatus === 'paid' ? 'unpaid' : 'paid'}`,
          label: `Mark as ${booking.paymentStatus === 'paid' ? 'unpaid' : 'paid'}`,
          icon: 'payments',
        },
      ];
    }
    if (booking.status === 'PENDING' || booking.status === 'SCHEDULED') {
      return [
        ...editAction,
        { id: 'CHECKED_IN', label: 'Check in', icon: 'login' },
        { id: 'NO_SHOW', label: 'Mark no-show', icon: 'person_off' },
        { id: 'CANCELLED', label: 'Cancel booking', icon: 'cancel' },
      ];
    }
    return [];
  }

  /** Opens resource assignment before check-in; other status changes submit immediately. */
  protected requestBookingAction(booking: BookingRecord, actionId: string): void {
    if (actionId === 'edit') {
      void this.router.navigate(['/app/booking', booking._id, 'edit'], {
        queryParamsHandling: 'preserve',
      });
      return;
    }
    if (actionId === 'add-services') {
      void this.router.navigate(['/app/booking', booking._id], { queryParamsHandling: 'preserve' });
      return;
    }
    if (actionId.startsWith('payment:')) {
      this.updatePaymentStatus(booking._id, actionId.replace('payment:', '') as 'unpaid' | 'paid');
      return;
    }
    const status = actionId as BookingStatus;
    if (status === 'CHECKED_IN') {
      this.checkInBooking = booking;
      return;
    }
    this.updateBookingStatus(booking._id, status);
  }

  protected closeCheckIn(): void {
    this.checkInBooking = null;
  }

  protected handleCheckedIn(): void {
    this.checkInBooking = null;
    this.resetAndLoadBookings();
  }

  protected updateBookingStatus(bookingId: string, status: BookingStatus): void {
    this.errorMessage = '';
    this.bookingService
      .updateBookingStatus(bookingId, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.resetAndLoadBookings(),
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to update booking status.';
        },
      });
  }

  protected updatePaymentStatus(bookingId: string, paymentStatus: 'unpaid' | 'paid'): void {
    this.errorMessage = '';
    this.bookingService
      .updatePaymentStatus(bookingId, { paymentStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.resetAndLoadBookings(),
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to update payment status.';
        },
      });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page === this.currentPage || (page > this.currentPage && !this.hasNextPage)) {
      return;
    }
    this.currentPage = page;
    this.loadBookings(false);
  }

  /** Requests the next stable offset page when the mobile sentinel enters view. */
  protected loadMoreBookings(): void {
    if (this.loading || this.loadingMore || !this.hasNextPage) return;
    this.currentPage += 1;
    this.loadBookings(false, true);
  }

  private loadBookings(showLoading = true, append = false): void {
    if (!append) this.currentPage = this.currentPage || 1;
    if (showLoading) this.loading = true;
    if (append) this.loadingMore = true;
    this.errorMessage = '';
    const query: BookingListQuery = {
      view: this.isTodayView ? 'today' : 'all',
      page: this.currentPage,
      limit: this.pageSize,
    };
    if (this.isTodayView) {
      const { from, to } = this.businessDayRange(this.dateTime.businessDateInputValue());
      query.from = from;
      query.to = to;
    } else if (this.updatedDateControl.value) {
      const { from, to } = this.businessDayRange(this.updatedDateControl.value);
      query.from = from;
      query.to = to;
    }
    if (this.resourceControl.value) query.resourceId = this.resourceControl.value;
    if (this.statusControl.value !== 'ALL') query.status = this.statusControl.value;
    const search = this.searchControl.value.trim();
    if (search.length >= 2) query.search = search;

    this.bookingService
      .getBookings(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ bookings, pagination }) => {
          this.bookings = append ? [...this.bookings, ...bookings] : bookings;
          this.totalBookings = pagination.total;
          this.loading = false;
          this.loadingMore = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load bookings.';
          this.loading = false;
          this.loadingMore = false;
          if (append) this.currentPage -= 1;
        },
      });
  }

  private resetAndLoadBookings(): void {
    this.currentPage = 1;
    this.bookings = [];
    this.loadBookings();
  }

  /** Restores the operational context after returning from a booking detail or edit page. */
  private restoreListState(): void {
    const params = this.route.snapshot.queryParamMap;
    const status = params.get('status') as BookingStatusFilter | null;

    this.viewControl.setValue(params.get('view') === 'all' ? 'ALL' : 'TODAY', { emitEvent: false });
    this.statusControl.setValue(
      this.statusFilters.some((option) => option.value === status) ? status! : 'ALL',
      { emitEvent: false },
    );
    this.searchControl.setValue(params.get('search') ?? '', { emitEvent: false });
    this.updatedDateControl.setValue(params.get('date') ?? '', { emitEvent: false });
    this.resourceControl.setValue(params.get('resource') ?? '', { emitEvent: false });
  }

  /** Keeps the URL aligned with visible filters without adding a browser-history entry for each edit. */
  private persistListState(): void {
    const queryParams = {
      view: this.isTodayView ? null : 'all',
      status: this.statusControl.value === 'ALL' ? null : this.statusControl.value,
      search: this.searchControl.value.trim() || null,
      date: this.isTodayView || !this.updatedDateControl.value ? null : this.updatedDateControl.value,
      resource: this.resourceControl.value || null,
    };

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Mobile cards append as the sentinel becomes visible; desktop uses explicit grid pagination. */
  private observeMobileLoadMore(element?: HTMLElement): void {
    this.mobileLoadObserver?.disconnect();
    if (!element || typeof IntersectionObserver === 'undefined') return;
    this.mobileLoadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.loadMoreBookings();
      },
      { rootMargin: '160px' },
    );
    this.mobileLoadObserver.observe(element);
  }

  private setResourceOptions(resources: ResourceRecord[]): void {
    this.personResourceIds.clear();
    resources
      .filter((resource) => resource.isPerson)
      .forEach((resource) => this.personResourceIds.add(resource._id));
    this.resourceOptions = [
      { value: '', label: 'All resources' },
      ...resources
        .filter((resource) => resource.isActive)
        .map((resource) => ({
          value: resource._id,
          label: `${resource.name} · ${resource.resourceType}`,
        })),
    ];
  }

  private businessDayRange(dateValue: string): { from: string; to: string } {
    // Booking storage is UTC; the shared service creates bounds for the configured business day.
    return this.dateTime.businessDayRange(dateValue);
  }
}
