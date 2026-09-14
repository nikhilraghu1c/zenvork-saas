import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { AppDataGridComponent } from '../../../../shared/data-grid/data-grid.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { BookingClientGridCellComponent } from '../../components/booking-client-grid-cell/booking-client-grid-cell.component';
import { BookingGridActionsComponent } from '../../components/booking-grid-actions/booking-grid-actions.component';
import { BookingStatusGridCellComponent } from '../../components/booking-status-grid-cell/booking-status-grid-cell.component';
import { ResourceRecord, ResourceService } from '../../../resources/services/resource.service';
import {
  BookingListQuery,
  BookingRecord,
  BookingService,
  BookingStatus,
} from '../../services/booking.service';

type BookingStatusFilter = 'ALL' | BookingStatus;
type AssignmentFilter = 'ALL' | 'assigned' | 'unassigned';

interface StatusFilterOption {
  value: BookingStatusFilter;
  label: string;
}

@Component({
  selector: 'app-booking-list',
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, AppDataGridComponent, AppSelectComponent],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss',
})
export class BookingListComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly resourceService = inject(ResourceService);
  private readonly destroyRef = inject(DestroyRef);

  /** An empty date initially shows all bookings; selecting one narrows the view to an India business day. */
  protected readonly dateControl = new FormControl('', { nonNullable: true });
  protected readonly resourceControl = new FormControl('', { nonNullable: true });
  protected readonly assignmentControl = new FormControl<AssignmentFilter>('ALL', {
    nonNullable: true,
  });
  protected readonly statusFilters: StatusFilterOption[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CHECKED_IN', label: 'Checked in' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No-show' },
  ];
  protected readonly assignmentOptions: AppSelectOption[] = [
    { value: 'ALL', label: 'All assignments' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'unassigned', label: 'Needs assignment' },
  ];

  protected resourceOptions: AppSelectOption[] = [{ value: '', label: 'All resources' }];
  protected readonly personResourceIds = new Set<string>();
  protected selectedStatus: BookingStatusFilter = 'ALL';
  protected bookings: BookingRecord[] = [];
  protected totalBookings = 0;
  protected loading = true;
  protected errorMessage = '';
  /** Defines the staff-oriented desktop grid, separating a booking date from its time slot. */
  protected readonly columnDefs: ColDef<BookingRecord>[] = [
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
      headerName: 'Time slot',
      minWidth: 142,
      flex: 0.9,
      valueFormatter: ({ data }) => this.timeSlotLabel(data),
    },
    {
      field: 'scheduledStartAt',
      headerName: 'Date',
      minWidth: 138,
      flex: 0.85,
      valueFormatter: ({ value }) => this.formatDate(value as string | null),
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

  /** Loads filters and refreshes the list whenever a list control changes. */
  ngOnInit(): void {
    [this.dateControl, this.resourceControl, this.assignmentControl].forEach((control) =>
      control.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.loadBookings()),
    );

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

  /** Applies one lifecycle filter at a time so its meaning remains clear to staff. */
  protected selectStatus(status: BookingStatusFilter): void {
    if (this.selectedStatus === status) return;
    this.selectedStatus = status;
    this.loadBookings();
  }

  /** Converts UTC booking timestamps to the current India-focused product display timezone. */
  protected formatTime(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(new Date(value))
      .toUpperCase();
  }

  /** Formats scheduled dates in IST so staff see the business calendar day. */
  protected formatDate(value: string | null): string {
    if (!value) return 'Unscheduled';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  /** Combines a planned start and end into the concise time slot shown in the grid. */
  protected timeSlotLabel(booking: BookingRecord | undefined): string {
    if (!booking?.scheduledStartAt) return 'Awaiting slot';
    const start = this.formatTime(booking.scheduledStartAt);
    return booking.scheduledEndAt ? `${start} – ${this.formatTime(booking.scheduledEndAt)}` : start;
  }

  /** Returns assigned resources generically without assuming salon-only resource types. */
  protected resourceLabel(booking: BookingRecord): string {
    return booking.resources.length
      ? booking.resources.map((resource) => resource.name).join(', ')
      : 'Unassigned';
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

  private loadBookings(): void {
    this.loading = true;
    this.errorMessage = '';
    const query: BookingListQuery = {};
    if (this.dateControl.value) {
      const { from, to } = this.indiaDayRange(this.dateControl.value);
      query.from = from;
      query.to = to;
    }
    if (this.resourceControl.value) query.resourceId = this.resourceControl.value;
    if (this.assignmentControl.value !== 'ALL') query.assignment = this.assignmentControl.value;
    if (this.selectedStatus !== 'ALL') query.status = this.selectedStatus;

    this.bookingService
      .getBookings(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ bookings, pagination }) => {
          this.bookings = bookings;
          this.totalBookings = pagination.total;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load bookings.';
          this.loading = false;
        },
      });
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

  private indiaDayRange(dateValue: string): { from: string; to: string } {
    const [year, month, day] = dateValue.split('-').map(Number);
    // Booking storage is UTC; these bounds represent midnight-to-midnight in Asia/Kolkata.
    const start = new Date(Date.UTC(year, month - 1, day, -5, -30));
    const end = new Date(Date.UTC(year, month - 1, day + 1, -5, -30));
    return { from: start.toISOString(), to: end.toISOString() };
  }
}
