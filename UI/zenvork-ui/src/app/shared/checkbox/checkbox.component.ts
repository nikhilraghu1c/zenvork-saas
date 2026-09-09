import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-checkbox',
  imports: [MatCheckboxModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppCheckboxComponent),
      multi: true,
    },
  ],
})
export class AppCheckboxComponent implements ControlValueAccessor {
  /** Text displayed beside the checkbox. */
  @Input({ required: true }) label = '';
  /** Prevents user interaction. */
  @Input() disabled = false;

  protected checked = false;
  private onChange: (checked: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** Receives the checked state supplied by Angular's parent form control. */
  writeValue(value: boolean | null): void {
    this.checked = value ?? false;
  }

  /** Stores Angular's callback to run whenever the checked state changes. */
  registerOnChange(onChange: (checked: boolean) => void): void {
    this.onChange = onChange;
  }

  /** Stores Angular's callback to run when the checkbox has been used. */
  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  /** Applies the disabled state supplied by Angular's parent form control. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Sends the changed state back to Angular's parent form control. */
  protected updateChecked(checked: boolean): void {
    this.checked = checked;
    this.onChange(checked);
    this.onTouched();
  }
}
