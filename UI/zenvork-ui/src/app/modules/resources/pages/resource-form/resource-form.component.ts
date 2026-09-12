import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AuthService } from '../../../auth/services/auth.service';
import { StaffService } from '../../../staff/services/staff.service';
import { ResourceService, ResourceTypeOption } from '../../services/resource.service';

@Component({
  selector: 'app-resource-form',
  imports: [ReactiveFormsModule, AppSelectComponent, AppButtonComponent, AppInputComponent],
  templateUrl: './resource-form.component.html',
  styleUrl: './resource-form.component.scss',
})
export class ResourceFormComponent implements OnInit {
  private readonly service = inject(ResourceService);
  private readonly staffService = inject(StaffService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  /** Reactive form matching the current resource-creation API contract. */
  protected readonly resourceForm = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    resourceType: ['', Validators.required],
    linkedUserId: [''],
  });
  protected types: ResourceTypeOption[] = [];
  protected accounts: { id: string; label: string }[] = [];
  /** Allows login linking only for a configured person resource type. */
  protected get isPersonResource(): boolean {
    return (
      this.types.find((type) => type.code === this.resourceForm.controls.resourceType.value)
        ?.isPerson === true
    );
  }

  /** Maps configured resource types to shared select options. */
  protected get typeOptions(): AppSelectOption[] {
    return this.types.map((type) => ({ value: type.code, label: type.name }));
  }
  /** Provides an optional login link using the available business accounts. */
  protected get accountOptions(): AppSelectOption[] {
    return [
      { value: '', label: 'No login linked' },
      ...this.accounts.map((account) => ({ value: account.id, label: account.label })),
    ];
  }
  protected optionsLoading = true;
  protected optionsError = '';
  protected serverError = '';
  protected loading = false;
  /** Loads the options needed to create a resource. */
  ngOnInit(): void {
    this.resourceForm.controls.resourceType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.isPersonResource) this.resourceForm.controls.linkedUserId.setValue('');
      });
    this.loadOptions();
  }
  /** Fetches tenant-specific resource types and owner-visible staff accounts. */
  protected loadOptions(): void {
    this.optionsLoading = true;
    this.optionsError = '';
    forkJoin({ options: this.service.getOptions(), staff: this.staffService.getStaff() })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.optionsLoading = false)),
      )
      .subscribe({
        next: ({ options, staff }) => {
          this.types = options.resourceTypes;
          const owner = this.auth.getCurrentUser();
          this.accounts = [
            ...(owner ? [{ id: owner.id, label: `${owner.name} (You)` }] : []),
            ...staff.users.map((user) => ({
              id: user._id,
              label: `${user.name} · ${user.mobile}`,
            })),
          ];
        },
        error: (error) =>
          (this.optionsError = error.error?.message ?? 'Unable to load resource options.'),
      });
  }
  /** Validates and creates a resource with an optional linked account. */
  protected submit(): void {
    if (this.loading || this.optionsLoading || this.optionsError || !this.types.length) return;
    this.resourceForm.controls.name.setValue(this.resourceForm.controls.name.value.trim());
    this.resourceForm.markAllAsTouched();
    if (this.resourceForm.invalid) return;
    const value = this.resourceForm.getRawValue();
    this.loading = true;
    this.serverError = '';
    this.service
      .createResource({
        ...value,
        linkedUserId: this.isPersonResource ? value.linkedUserId || null : null,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/app/resources'),
        error: (error) => (this.serverError = error.error?.message ?? 'Unable to create resource.'),
      });
  }
  /** Returns to the resource list without creating a resource. */
  protected cancel(): void {
    void this.router.navigateByUrl('/app/resources');
  }
  /** Returns validation feedback after the resource name has been visited. */
  protected nameError(): string {
    const control = this.resourceForm.controls.name;
    if (!control.touched || !control.invalid) return '';
    return control.hasError('required')
      ? 'Resource name is required.'
      : 'Use between 3 and 50 characters.';
  }
}
