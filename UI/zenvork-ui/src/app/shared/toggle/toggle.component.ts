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
  @Input({ required: true }) label = '';
  @Input() hint = '';
  protected checked = false;
  protected disabled = false;
  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  writeValue(value: boolean | null): void {
    this.checked = value ?? false;
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
    this.checked = value;
    this.onChange(value);
    this.onTouched();
  }
}
