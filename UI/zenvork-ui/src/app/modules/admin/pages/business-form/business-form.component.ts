import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { BusinessTypeOption, BusinessTypeService } from '../../services/business-type.service';
import { AdminService, CreateBusinessRequest } from '../../services/admin.service';

@Component({
  selector: 'app-business-form',
  imports: [ReactiveFormsModule, MatIconModule, AppButtonComponent, AppInputComponent],
  templateUrl: './business-form.component.html',
  styleUrl: './business-form.component.scss',
})
export class BusinessFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly admin = inject(AdminService);
  private readonly businessTypes = inject(BusinessTypeService);
  private readonly router = inject(Router);

  /** Active platform business types available to the registering administrator. */
  protected businessTypeOptions: BusinessTypeOption[] = [];
  protected readonly businessForm = this.formBuilder.nonNullable.group({
    businessName: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    businessTypeId: ['', Validators.required],
    ownerName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
  });
  protected submitted = false;
  protected loading = false;
  protected serverError = '';
  protected temporaryPassword = '';

  ngOnInit(): void {
    this.businessTypes.getActive().subscribe({
      next: ({ businessTypes }) => {
        this.businessTypeOptions = businessTypes;
      },
      error: (error: HttpErrorResponse) => {
        this.serverError = error.error?.message ?? 'Unable to load business types.';
      },
    });
  }

  /** Validates identity data; the server generates the one-time owner password. */
  protected submit(): void {
    this.submitted = true;
    this.serverError = '';
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload: CreateBusinessRequest = {
      ...this.businessForm.getRawValue(),
      planExpiresAt: null,
    };
    this.admin
      .createBusiness(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ temporaryPassword }) => {
          this.temporaryPassword = temporaryPassword;
          this.businessForm.disable();
        },
        error: (error: HttpErrorResponse) => {
          this.serverError = error.error?.message ?? 'Unable to register business.';
        },
      });
  }

  /** Returns the appropriate user-facing validation message for one form control. */
  protected fieldError(
    field: 'businessName' | 'businessTypeId' | 'ownerName' | 'email' | 'mobile',
  ): string {
    const control = this.businessForm.controls[field];
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

  /** Returns to the platform business directory without changing any records. */
  protected cancel(): void {
    void this.router.navigateByUrl('/admin/businesses');
  }
}
