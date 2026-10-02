import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/checkbox/checkbox.component';
import { AppDatePickerComponent } from '../../../../shared/date-picker/date-picker.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { BookingDateField, BookingStatus } from '../../services/booking.service';

export interface BookingFilterSelection {
  statuses: BookingStatus[];
  resourceId: string;
  updatedDate: string;
  dateField: BookingDateField;
}

@Component({
  selector: 'app-booking-filter-dialog',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppDatePickerComponent,
    AppSelectComponent,
  ],
  templateUrl: './booking-filter-dialog.component.html',
  styleUrl: './booking-filter-dialog.component.scss',
})
export class BookingFilterDialogComponent implements OnInit {
  @Input({ required: true }) statuses: BookingStatus[] = [];
  @Input({ required: true }) resourceOptions: AppSelectOption[] = [];
  @Input({ required: true }) resourceId = '';
  @Input({ required: true }) updatedDate = '';
  @Input() dateField: BookingDateField = 'modified';
  @Input() showModifiedDate = false;
  @Output() closed = new EventEmitter<void>();
  @Output() filtersApplied = new EventEmitter<BookingFilterSelection>();

  protected readonly resourceControl = new FormControl('', { nonNullable: true });
  protected readonly updatedDateControl = new FormControl('', { nonNullable: true });
  protected readonly dateFieldControl = new FormControl<BookingDateField>('modified', {
    nonNullable: true,
  });
  protected readonly dateFieldOptions: AppSelectOption[] = [
    { value: 'modified', label: 'Modified on' },
    { value: 'created', label: 'Created on' },
    { value: 'scheduled', label: 'Scheduled on' },
  ];
  protected readonly statusOptions: BookingStatus[] = [
    'PENDING',
    'SCHEDULED',
    'CHECKED_IN',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ];
  protected readonly statusSelections: Record<BookingStatus, FormControl<boolean>> = {
    PENDING: new FormControl(false, { nonNullable: true }),
    SCHEDULED: new FormControl(false, { nonNullable: true }),
    CHECKED_IN: new FormControl(false, { nonNullable: true }),
    COMPLETED: new FormControl(false, { nonNullable: true }),
    CANCELLED: new FormControl(false, { nonNullable: true }),
    NO_SHOW: new FormControl(false, { nonNullable: true }),
  };

  /** Copies the applied page filters into a dialog-local draft until staff chooses Apply. */
  ngOnInit(): void {
    this.statusOptions.forEach((status) => {
      this.statusSelections[status].setValue(this.statuses.includes(status));
    });
    this.resourceControl.setValue(this.resourceId);
    this.updatedDateControl.setValue(this.updatedDate);
    this.dateFieldControl.setValue(this.dateField);
  }

  protected statusControl(status: BookingStatus): FormControl<boolean> {
    return this.statusSelections[status];
  }

  protected clear(): void {
    this.statusOptions.forEach((status) => this.statusSelections[status].setValue(false));
    this.resourceControl.setValue('');
    this.updatedDateControl.setValue('');
    this.dateFieldControl.setValue('modified');
  }

  protected apply(): void {
    this.filtersApplied.emit({
      statuses: this.statusOptions.filter((status) => this.statusSelections[status].value),
      resourceId: this.resourceControl.value,
      updatedDate: this.updatedDateControl.value,
      dateField: this.dateFieldControl.value,
    });
  }

  protected statusLabel(status: BookingStatus): string {
    return status
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected get dateLabel(): string {
    return (
      this.dateFieldOptions.find((option) => option.value === this.dateFieldControl.value)?.label ??
      'Modified on'
    );
  }
}
