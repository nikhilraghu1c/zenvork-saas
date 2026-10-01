import { Component, DestroyRef, Input, forwardRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

let nextDatePickerId = 0;

@Component({
  selector: 'app-date-picker',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDatePickerComponent),
      multi: true,
    },
  ],
})
export class AppDatePickerComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private datePickerMode: 'date' | 'month' = 'date';

  @Input({ required: true }) label = '';
  @Input() set mode(value: 'date' | 'month') {
    this.datePickerMode = value;
    this.minDate = this.toDate(this.minValue);
    this.maxDate = this.toDate(this.maxValue);
  }
  get mode(): 'date' | 'month' {
    return this.datePickerMode;
  }
  @Input() labelPlacement: 'floating' | 'outside' = 'floating';
  @Input() subscriptSizing: 'fixed' | 'dynamic' = 'fixed';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() errorMessage = '';
  @Input() required = false;
  @Input() inputId = `app-date-picker-${nextDatePickerId++}`;
  @Input({ alias: 'readonly' }) isReadonly = false;
  @Input() set min(value: string) {
    this.minValue = value;
    this.minDate = this.toDate(value);
  }
  @Input() set max(value: string) {
    this.maxValue = value;
    this.maxDate = this.toDate(value);
  }

  protected readonly control = new FormControl<Date | null>(null);
  protected minDate: Date | null = null;
  protected maxDate: Date | null = null;
  protected disabled = false;
  private minValue = '';
  private maxValue = '';
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.onChange(this.toDateInputValue(value)));
  }

  /** Receives a business-calendar date in YYYY-MM-DD form without converting it to a UTC instant. */
  writeValue(value: string | null): void {
    this.control.setValue(this.toDate(value), { emitEvent: false });
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    if (disabled) this.control.disable({ emitEvent: false });
    else this.control.enable({ emitEvent: false });
  }

  protected markTouched(): void {
    this.onTouched();
  }

  /** Stores a month choice as its first calendar day, but emits only YYYY-MM to the parent form. */
  protected selectMonth(value: Date, picker: MatDatepicker<Date>): void {
    if (this.mode !== 'month') return;
    this.control.setValue(value);
    this.markTouched();
    picker.close();
  }

  private toDate(value: string | null | undefined): Date | null {
    if (this.mode === 'month') {
      const monthMatch = /^(\d{4})-(\d{2})$/.exec(value ?? '');
      if (!monthMatch) return null;
      const [year, month] = monthMatch.slice(1).map(Number);
      const date = new Date(year, month - 1, 1);
      return date.getFullYear() === year && date.getMonth() === month - 1 ? date : null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
    if (!match) return null;
    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
      ? date
      : null;
  }

  private toDateInputValue(value: Date | null): string {
    if (!value) return '';
    const month = String(value.getMonth() + 1).padStart(2, '0');
    if (this.mode === 'month') return `${value.getFullYear()}-${month}`;
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
}
