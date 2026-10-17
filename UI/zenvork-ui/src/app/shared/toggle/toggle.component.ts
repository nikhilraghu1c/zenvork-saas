import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
@Component({
  selector: 'app-toggle',
  imports: [MatSlideToggleModule],
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppToggleComponent), multi: true },
  ],
})
export class AppToggleComponent implements ControlValueAccessor {
  /** Text displayed beside the toggle. */
  @Input({ required: true }) label = '';
  /** Optional supporting text displayed below the label. */
  @Input() hint = '';
  /** Allows a non-form caller to render a read-only checked state. */
  @Input()
  set checked(value: boolean | null | undefined) {
    if (value !== undefined) this.value = value ?? false;
  }
  /** Prevents user interaction for either form-bound or read-only usage. */
  @Input() disabled = false;
  protected value = false;
  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  writeValue(value: boolean | null): void {
    this.value = value ?? false;
  }
  registerOnChange(onChange: (value: boolean) => void): void {
    this.onChange = onChange;
  }
  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }
  protected change(value: boolean): void {
    if (this.disabled) return;
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }
}
