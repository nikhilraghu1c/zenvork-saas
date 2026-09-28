import { Component, DestroyRef, Input, forwardRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';

let nextTimePickerId = 0;

@Component({
  selector: 'app-time-picker',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
  ],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTimePickerComponent),
      multi: true,
    },
  ],
})
export class AppTimePickerComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) label = '';
  @Input() labelPlacement: 'floating' | 'outside' = 'floating';
  @Input() subscriptSizing: 'fixed' | 'dynamic' = 'fixed';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() errorMessage = '';
  @Input() required = false;
  @Input() inputId = `app-time-picker-${nextTimePickerId++}`;
  @Input() interval: string | number = '30m';
  @Input({ alias: 'readonly' }) isReadonly = false;
  @Input() set min(value: string) {
    this.minTime = this.toTimeDate(value);
  }
  @Input() set max(value: string) {
    this.maxTime = this.toTimeDate(value);
  }

  protected readonly control = new FormControl<Date | null>(null);
  protected minTime: Date | null = null;
  protected maxTime: Date | null = null;
  protected disabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.onChange(this.toTimeInputValue(value)));
  }

  /** Maps the shared HH:mm booking value to the Date shape required by Material's time picker. */
  writeValue(value: string | null): void {
    this.control.setValue(this.toTimeDate(value), { emitEvent: false });
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

  private toTimeDate(value: string | null | undefined): Date | null {
    const match = /^(\d{2}):(\d{2})$/.exec(value ?? '');
    if (!match) return null;
    const [hour, minute] = match.slice(1).map(Number);
    if (hour > 23 || minute > 59) return null;
    return new Date(2000, 0, 1, hour, minute);
  }

  private toTimeInputValue(value: Date | null): string {
    if (!value) return '';
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
}
