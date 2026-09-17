import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import {
  ResourceRecord,
  ResourceService,
  ResourceTypeOption,
} from '../../../resources/services/resource.service';
import { BookingRecord, BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-booking-check-in-dialog',
  imports: [ReactiveFormsModule, MatIconModule, AppButtonComponent, AppSelectComponent],
  templateUrl: './booking-check-in-dialog.component.html',
  styleUrl: './booking-check-in-dialog.component.scss',
})
export class BookingCheckInDialogComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly resourceService = inject(ResourceService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) booking!: BookingRecord;
  @Output() closed = new EventEmitter<void>();
  @Output() checkedIn = new EventEmitter<BookingRecord>();

  protected resources: ResourceRecord[] = [];
  protected resourceTypes: ResourceTypeOption[] = [];
  protected readonly resourceSelections: Record<string, FormControl<string>> = {};
  protected loading = true;
  protected submitting = false;
  protected errorMessage = '';

  /** Loads configured resource types so staff select a person, room, or equipment separately. */
  ngOnInit(): void {
    forkJoin({
      resources: this.resourceService.getResources(),
      resourceTypes: this.resourceService.getOptions(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ resources: resourceResponse, resourceTypes: resourceTypesResponse }) => {
          this.resources = resourceResponse.resources.filter((resource) => resource.isActive);
          this.resourceTypes = resourceTypesResponse.resourceTypes.filter((type) =>
            this.resources.some((resource) => resource.resourceType === type.code),
          );
          if (!this.resourceTypes.length) {
            // Keep the selector usable for legacy tenants whose type configuration is incomplete.
            this.resourceTypes = [...new Set(this.resources.map((resource) => resource.resourceType))].map(
              (code) => ({
                code,
                name: code,
                isPerson: this.resources.some(
                  (resource) => resource.resourceType === code && resource.isPerson,
                ),
              }),
            );
          }
          const activeIds = new Set(this.resources.map((resource) => resource._id));
          const existingResources = this.booking.resources
            .filter((resource) => activeIds.has(resource._id))
            .map((resource) => resource._id);
          this.resourceTypes.forEach((type) => {
            const existingResourceId = this.resources.find(
              (resource) => resource.resourceType === type.code && existingResources.includes(resource._id),
            )?._id;
            this.resourceSelections[type.code] = new FormControl(existingResourceId ?? '', {
              nonNullable: true,
            });
          });
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load resources.';
          this.loading = false;
        },
      });
  }

  /** Provides a dedicated, type-filtered dropdown instead of mixing all business resources together. */
  protected resourceOptions(type: ResourceTypeOption): AppSelectOption[] {
    return [
      { value: '', label: `No ${type.name.toLowerCase()} assigned` },
      ...this.resources
        .filter((resource) => resource.resourceType === type.code)
        .map((resource) => ({ value: resource._id, label: resource.name })),
    ];
  }

  protected resourceControl(typeCode: string): FormControl<string> {
    return this.resourceSelections[typeCode];
  }

  /** Builds the backend resource assignment from one optional selection per configured type. */
  protected selectedResourceIds(): string[] {
    return this.resourceTypes
      .map((type) => this.resourceControl(type.code)?.value)
      .filter((resourceId): resourceId is string => Boolean(resourceId));
  }

  /** Keeps the dialog mounted while its one atomic check-in request is in flight. */
  protected close(): void {
    if (!this.submitting) this.closed.emit();
  }

  protected confirm(): void {
    const resourceIds = this.selectedResourceIds();
    if (this.submitting || resourceIds.length === 0) return;

    this.submitting = true;
    this.errorMessage = '';
    this.bookingService
      .updateBookingStatus(this.booking._id, {
        status: 'CHECKED_IN',
        resourceIds,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ booking }) => {
          this.submitting = false;
          this.checkedIn.emit(booking);
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to check in this booking.';
          this.submitting = false;
        },
      });
  }
}
