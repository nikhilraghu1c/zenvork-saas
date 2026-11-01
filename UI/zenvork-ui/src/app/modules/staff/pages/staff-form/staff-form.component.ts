import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/checkbox/checkbox.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { BookingAccessScope, CreateStaffRequest, StaffService } from '../../services/staff.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-staff-form',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppInputComponent,
    AppSelectComponent,
    TranslatePipe,
  ],
  templateUrl: './staff-form.component.html',
  styleUrl: './staff-form.component.scss',
})
export class StaffFormComponent {
  /** Reactive form matching the current staff-creation API contract. */
  protected readonly staffForm;
  protected submitted = false;
  protected loading = false;
  protected serverError = '';
  protected readonly bookingAccessOptions: AppSelectOption[];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly staffService: StaffService,
    private readonly router: Router,
    private readonly language: LanguageService,
  ) {
    this.bookingAccessOptions = [
      { value: 'NONE', label: this.language.translate('staff.noBookingAccess') },
      { value: 'OWN_AND_UNASSIGNED', label: this.language.translate('staff.ownBookings') },
      { value: 'ALL', label: this.language.translate('staff.allBookings') },
    ];
    this.staffForm = this.formBuilder.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      bookingAccessScope: ['NONE'],
      canSendReminders: [false],
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
      bookingAccessScope: staffValues.bookingAccessScope as BookingAccessScope,
      ...(email.trim() ? { email: email.trim() } : {}),
    };

    this.staffService
      .createStaff(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/app/staff'),
        error: (error: HttpErrorResponse) => {
          this.serverError = error.error?.message ?? this.language.translate('staff.createFailed');
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
    if (!control.errors || !(this.submitted || control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      return this.language.translate('staff.fieldRequired');
    }
    if (control.hasError('email')) {
      return this.language.translate('staff.invalidEmail');
    }
    if (control.hasError('pattern')) {
      return this.language.translate('staff.invalidMobile');
    }
    if (control.hasError('minlength')) {
      return this.language
        .translate('staff.minCharacters')
        .replace('{count}', String(control.errors['minlength'].requiredLength as number));
    }
    if (control.hasError('maxlength')) {
      return this.language.translate('staff.valueTooLong');
    }
    return this.language.translate('staff.validValue');
  }
}
