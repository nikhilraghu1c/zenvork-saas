import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { AppToggleComponent } from '../../../../shared/toggle/toggle.component';
import { BusinessTypeService } from '../../services/business-type.service';
import {
  AdminResourceType,
  CreateResourceTypeRequest,
  ResourceTypeService,
} from '../../services/resource-type.service';

@Component({
  selector: 'app-resource-type-form',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
    AppToggleComponent,
  ],
  templateUrl: './resource-type-form.component.html',
  styleUrl: './resource-type-form.component.scss',
})
export class ResourceTypeFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly businessTypes = inject(BusinessTypeService);
  private readonly resourceTypesApi = inject(ResourceTypeService);
  private editingResourceType: AdminResourceType | null = null;

  protected readonly resourceTypeForm = this.formBuilder.nonNullable.group({
    businessTypeId: ['', Validators.required],
    code: ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]*$/), Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(50)]],
    isPerson: [false],
  });
  protected businessTypeOptions: AppSelectOption[] = [];
  protected loading = true;
  protected submitting = false;
  protected submitted = false;
  protected serverError = '';

  protected get isEditMode(): boolean {
    return this.editingResourceType !== null;
  }

  protected get pageTitle(): string {
    return this.isEditMode ? 'Edit Resource Type' : 'Add Resource Type';
  }

  ngOnInit(): void {
    const businessTypeId = this.route.snapshot.paramMap.get('businessTypeId');
    const code = this.route.snapshot.paramMap.get('code')?.toUpperCase();
    if (businessTypeId && code) {
      this.loadForEdit(businessTypeId, code);
      return;
    }
    this.loadForCreate();
  }

  /** Creates a new resource type under an active platform business type. */
  protected submit(): void {
    this.submitted = true;
    this.serverError = '';
    if (this.resourceTypeForm.invalid || this.submitting) {
      this.resourceTypeForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    if (this.editingResourceType) {
      this.resourceTypesApi
        .updateName(this.editingResourceType, this.resourceTypeForm.controls.name.value.trim())
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: () => void this.router.navigateByUrl('/admin/resource-types'),
          error: (error: HttpErrorResponse) => {
            this.serverError = error.error?.message ?? 'Unable to update resource type.';
          },
        });
      return;
    }

    const formValue = this.resourceTypeForm.getRawValue();
    const payload: CreateResourceTypeRequest = {
      businessTypeId: formValue.businessTypeId,
      code: formValue.code.trim().toUpperCase(),
      name: formValue.name.trim(),
      isPerson: formValue.isPerson,
    };
    this.resourceTypesApi
      .create(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/admin/resource-types'),
        error: (error: HttpErrorResponse) => {
          this.serverError = error.error?.message ?? 'Unable to create resource type.';
        },
      });
  }

  protected fieldError(field: 'businessTypeId' | 'code' | 'name'): string {
    const control = this.resourceTypeForm.controls[field];
    if (!control.errors || !(this.submitted || control.touched)) return '';
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('pattern')) {
      return 'Use uppercase letters, numbers, and underscores only.';
    }
    if (control.hasError('maxlength')) return 'This value is too long.';
    return 'Enter a valid value.';
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/admin/resource-types');
  }

  private loadForCreate(): void {
    this.businessTypes.getActive().subscribe({
      next: ({ businessTypes }) => {
        this.businessTypeOptions = businessTypes.map((businessType) => ({
          value: businessType.id,
          label: businessType.name,
        }));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.serverError = error.error?.message ?? 'Unable to load business types.';
        this.loading = false;
      },
    });
  }

  private loadForEdit(businessTypeId: string, code: string): void {
    this.resourceTypesApi.getAll().subscribe({
      next: ({ resourceTypes }) => {
        const resourceType = resourceTypes.find(
          (item) => item.businessTypeId === businessTypeId && item.code === code,
        );
        if (!resourceType) {
          this.serverError = 'Resource type not found.';
          this.loading = false;
          return;
        }
        this.editingResourceType = resourceType;
        this.businessTypeOptions = [
          {
            value: resourceType.businessTypeId,
            label: resourceType.businessTypeName,
          },
        ];
        this.resourceTypeForm.setValue({
          businessTypeId: resourceType.businessTypeId,
          code: resourceType.code,
          name: resourceType.name,
          isPerson: resourceType.isPerson,
        });
        // Codes and person semantics are immutable once tenant resources may rely on them.
        this.resourceTypeForm.controls.businessTypeId.disable();
        this.resourceTypeForm.controls.code.disable();
        this.resourceTypeForm.controls.isPerson.disable();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.serverError = error.error?.message ?? 'Unable to load resource type.';
        this.loading = false;
      },
    });
  }
}
