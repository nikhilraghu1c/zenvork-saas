import { Component, Input, ViewEncapsulation, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface AppSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

let nextSelectId = 0;

@Component({
  selector: 'app-select',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  // The overlay is outside the component host; all styles use wrapper-specific classes.
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppSelectComponent), multi: true },
  ],
})
export class AppSelectComponent implements ControlValueAccessor {
  /** Label displayed inside the field or above it. */
  @Input({ required: true }) label = '';
  /** Selectable string values with display labels and optional disabled states. */
  @Input() options: AppSelectOption[] = [];
  /** Chooses whether the label floats inside the field or sits above it. */
  @Input() labelPlacement: 'floating' | 'outside' = 'floating';
  /** Controls whether Material reserves space for supporting feedback. */
  @Input() subscriptSizing: 'fixed' | 'dynamic' = 'fixed';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() errorMessage = '';
  @Input() required = false;
  /** Stable identifier associating an outside label with its select. */
  @Input() selectId = `app-select-${nextSelectId++}`;
  protected value = '';
  protected disabled = false;
  protected readonly errorStateMatcher = { isErrorState: () => !!this.errorMessage };
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** Receives a value supplied by the parent form control. */
  writeValue(value: string | null): void {
    this.value = value ?? '';
  }
  /** Stores the callback that propagates selections to the parent form. */
  registerOnChange(callback: (value: string) => void): void {
    this.onChange = callback;
  }
  /** Stores the callback that marks the parent control as visited. */
  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }
  /** Applies the disabled state supplied by the parent form control. */
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }
  /** Sends the selected value back to the parent form control. */
  protected updateValue(value: string): void {
    this.value = value;
    this.onChange(value);
  }
  /** Marks the field as visited after blur or closing the dropdown. */
  protected markTouched(): void {
    this.onTouched();
  }
}
