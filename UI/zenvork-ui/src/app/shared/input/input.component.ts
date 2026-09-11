import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

let nextInputId = 0;

@Component({
  selector: 'app-input',
  imports: [MatFormFieldModule, MatInputModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true,
    },
  ],
})
export class AppInputComponent implements ControlValueAccessor {
  /** Label displayed inside the field or above it. */
  @Input({ required: true }) label = '';
  /** Chooses whether the label is Material-floating or rendered above the field. */
  @Input() labelPlacement: 'floating' | 'outside' = 'floating';
  /** Controls Material's floating-label behavior. */
  @Input() floatLabel: 'auto' | 'always' = 'auto';
  /** Controls whether Material reserves hint and error space below the field. */
  @Input() subscriptSizing: 'fixed' | 'dynamic' = 'fixed';
  /** Optional stable ID used to associate an outside label with its input. */
  @Input() inputId = `app-input-${nextInputId++}`;
  /** Native input type used for appropriate browser behavior and keyboards. */
  @Input() type: 'email' | 'password' | 'tel' | 'text' = 'text';
  @Input() placeholder = '';
  @Input() autocomplete = '';
  @Input() hint = '';
  @Input() errorMessage = '';
  @Input() required = false;
  /** Emits when the native input loses focus. */
  @Output() inputBlur = new EventEmitter<void>();

  protected value = '';
  protected disabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** Receives a value supplied by Angular's parent form control. */
  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  /** Stores Angular's callback to run whenever the user changes the value. */
  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  /** Stores Angular's callback to run when the field has been visited. */
  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  /** Applies the disabled state supplied by Angular's parent form control. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Sends the typed native-input value back to Angular's parent form control. */
  protected updateValue(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }

  /** Marks the field as visited and notifies any listener of the blur event. */
  protected markTouched(): void {
    this.onTouched();
    this.inputBlur.emit();
  }
}
