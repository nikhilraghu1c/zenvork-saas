import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-quantity-stepper',
  imports: [MatIconModule],
  templateUrl: './quantity-stepper.component.html',
  styleUrl: './quantity-stepper.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuantityStepperComponent),
      multi: true,
    },
  ],
})
export class QuantityStepperComponent implements ControlValueAccessor {
  /** Lowest valid line-item quantity. */
  @Input() min = 1;
  /** Prevents an accidental unbounded group-booking quantity. */
  @Input() max = 999;
  /** Describes the specific booking service controlled by this stepper. */
  @Input({ required: true }) ariaLabel = 'Quantity';

  protected value = 1;
  protected disabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | number | null): void {
    const parsedValue = Number(value);
    this.value = Number.isSafeInteger(parsedValue)
      ? Math.min(this.max, Math.max(this.min, parsedValue))
      : this.min;
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Applies one bounded increment or decrement and keeps the reactive form value in sync. */
  protected changeBy(amount: number): void {
    const nextValue = Math.min(this.max, Math.max(this.min, this.value + amount));
    if (nextValue === this.value || this.disabled) {
      return;
    }
    this.value = nextValue;
    this.onChange(String(this.value));
    this.onTouched();
  }
}
