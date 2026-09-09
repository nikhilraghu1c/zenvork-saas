import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  BusinessRegistrationRequest,
  BusinessRegistrationService,
} from './services/business-registration.service';
import { AppButtonComponent } from '../../shared/button/button.component';
import { AppInputComponent } from '../../shared/input/input.component';

interface BusinessTypeOption {
  /** Value accepted by the registration API. */
  value: 'SALON' | 'CLINIC';
  /** Text displayed in the registration tile. */
  label: string;
  /** Angular Material icon displayed in the registration tile. */
  iconName: string;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, MatIconModule, RouterLink, AppButtonComponent, AppInputComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  /** Registration-specific options; these will later be loaded from the backend. */
  protected readonly businessTypes: BusinessTypeOption[] = [
    { value: 'SALON', label: 'Salon', iconName: 'content_cut' },
    { value: 'CLINIC', label: 'Clinic', iconName: 'medical_services' },
  ];

  /** Reactive form that mirrors the business-registration API payload. */
  protected readonly registrationForm;
  /** Enables validation feedback after the first submit attempt. */
  protected submitted = false;
  /** Prevents duplicate submissions while the registration request is in progress. */
  protected loading = false;
  /** Error message returned by the registration API. */
  protected serverError = '';
  /** Success message returned after the business and owner are created. */
  protected successMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly businessRegistration: BusinessRegistrationService,
  ) {
    this.registrationForm = this.formBuilder.nonNullable.group({
      businessName: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      businessType: ['SALON' as 'SALON' | 'CLINIC', Validators.required],
      ownerName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    });
  }

  /** Validates the form, then sends its values to the registration API. */
  protected submit(): void {
    this.submitted = true;
    this.serverError = '';

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload: BusinessRegistrationRequest = this.registrationForm.getRawValue();

    this.businessRegistration
      .register(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.registrationForm.disable();
        },
        error: (error: HttpErrorResponse) => {
          this.serverError = error.error?.message ?? 'Unable to create your business account.';
        },
      });
  }

  /** Returns the appropriate user-facing validation message for one form control. */
  protected fieldError(
    field: 'businessName' | 'businessType' | 'ownerName' | 'email' | 'mobile' | 'password',
  ): string {
    const control = this.registrationForm.controls[field];
    if (!control.errors || !(this.submitted || control.touched)) {
      return '';
    }

    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';
    if (control.hasError('pattern')) return 'Enter a valid 10-digit mobile number.';
    if (control.hasError('minlength')) {
      const minimum = control.errors['minlength'].requiredLength as number;
      return `Use at least ${minimum} characters.`;
    }
    if (control.hasError('maxlength')) return 'This value is too long.';
    return 'Enter a valid value.';
  }
}
