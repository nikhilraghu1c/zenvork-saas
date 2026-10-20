import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import {
  AdminBusinessType,
  BusinessTypeService,
  CreateBusinessTypeRequest,
} from '../../services/business-type.service';

@Component({
  selector: 'app-business-type-form',
  imports: [ReactiveFormsModule, MatIconModule, AppButtonComponent, AppInputComponent],
  templateUrl: './business-type-form.component.html',
  styleUrl: './business-type-form.component.scss',
})
export class BusinessTypeFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly businessTypesApi = inject(BusinessTypeService);
  private editingBusinessType: AdminBusinessType | null = null;

  protected readonly businessTypeForm = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]*$/), Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(50)]],
    iconName: ['business', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/), Validators.maxLength(50)]],
  });
  protected loading = true;
  protected submitting = false;
  protected submitted = false;
  protected serverError = '';

  protected get isEditMode(): boolean {
    return this.editingBusinessType !== null;
  }

  protected get pageTitle(): string {
    return this.isEditMode ? 'Edit Business Type' : 'Add Business Type';
  }

  ngOnInit(): void {
    const businessTypeId = this.route.snapshot.paramMap.get('id');
    if (businessTypeId) {
      this.loadForEdit(businessTypeId);
      return;
    }
    this.loading = false;
  }

  protected submit(): void {
    this.submitted = true;
    this.serverError = '';
    if (this.businessTypeForm.invalid || this.submitting) {
      this.businessTypeForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const formValue = this.businessTypeForm.getRawValue();
    const payload: CreateBusinessTypeRequest = {
      code: formValue.code.trim().toUpperCase(),
      name: formValue.name.trim(),
      iconName: formValue.iconName.trim(),
    };

    if (this.editingBusinessType) {
      this.businessTypesApi
        .update(this.editingBusinessType.id, { name: payload.name, iconName: payload.iconName })
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: () => void this.router.navigateByUrl('/admin/business-types'),
          error: (error: HttpErrorResponse) => {
            this.serverError = error.error?.message ?? 'Unable to update business type.';
          },
        });
      return;
    }

    this.businessTypesApi
      .create(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/admin/business-types'),
        error: (error: HttpErrorResponse) => {
          this.serverError = error.error?.message ?? 'Unable to create business type.';
        },
      });
  }

  protected fieldError(field: 'code' | 'name' | 'iconName'): string {
    const control = this.businessTypeForm.controls[field];
    if (!control.errors || !(this.submitted || control.touched)) return '';
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('pattern')) {
      return field === 'code'
        ? 'Use uppercase letters, numbers, and underscores only.'
        : 'Use lowercase letters, numbers, and underscores only.';
    }
    if (control.hasError('maxlength')) return 'This value is too long.';
    return 'Enter a valid value.';
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/admin/business-types');
  }

  private loadForEdit(businessTypeId: string): void {
    this.businessTypesApi.getAll().subscribe({
      next: ({ businessTypes }) => {
        const businessType = businessTypes.find((item) => item.id === businessTypeId);
        if (!businessType) {
          this.serverError = 'Business type not found.';
          this.loading = false;
          return;
        }
        this.editingBusinessType = businessType;
        this.businessTypeForm.setValue({
          code: businessType.code,
          name: businessType.name,
          iconName: businessType.iconName,
        });
        // Codes are permanent catalogue identifiers and cannot be changed after businesses reference them.
        this.businessTypeForm.controls.code.disable();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.serverError = error.error?.message ?? 'Unable to load business type.';
        this.loading = false;
      },
    });
  }
}
