import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { CreateStaffRequest, StaffService } from '../../services/staff.service';

@Component({
  selector: 'app-staff-form',
  imports: [ReactiveFormsModule, MatIconModule, AppButtonComponent, AppInputComponent],
  templateUrl: './staff-form.component.html',
  styleUrl: './staff-form.component.scss',
})
export class StaffFormComponent {
  /** Reactive form matching the current staff-creation API contract. */
  protected readonly staffForm;
  protected submitted = false;
  protected loading = false;
  protected serverError = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly staffService: StaffService,
    private readonly router: Router,
  ) {
    this.staffForm = this.formBuilder.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    });
  }

  /** Validates and creates the new staff account. */
  protected submit(): void {
    this.submitted = true;
    this.serverError = '';

    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, ...staffValues } = this.staffForm.getRawValue();
    const payload: CreateStaffRequest = {
      ...staffValues,
      ...(email.trim() ? { email: email.trim() } : {}),
    };

    this.staffService
      .createStaff(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/app/staff'),
        error: (error: HttpErrorResponse) => {
          this.serverError = error.error?.message ?? 'Unable to create staff account.';
        },
      });
  }

  /** Returns to the staff list without creating an account. */
  protected cancel(): void {
    this.router.navigateByUrl('/app/staff');
  }

  /** Returns the appropriate validation feedback for a form field. */
  protected fieldError(field: 'name' | 'email' | 'mobile' | 'password'): string {
    const control = this.staffForm.controls[field];
    if (!control.errors || !(this.submitted || control.touched)) return '';

    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';
    if (control.hasError('pattern')) return 'Enter a valid 10-digit mobile number.';
    if (control.hasError('minlength')) {
      return `Use at least ${control.errors['minlength'].requiredLength as number} characters.`;
    }
    if (control.hasError('maxlength')) return 'This value is too long.';
    return 'Enter a valid value.';
  }
}
