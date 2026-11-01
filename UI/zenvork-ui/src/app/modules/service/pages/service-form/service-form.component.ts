import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AppToggleComponent } from '../../../../shared/toggle/toggle.component';
import { ServiceService } from '../../services/service.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-service-form',
  imports: [
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    AppToggleComponent,
    TranslatePipe,
  ],
  templateUrl: './service-form.component.html',
  styleUrl: './service-form.component.scss',
})
export class ServiceFormComponent implements OnInit {
  private readonly service = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly language = inject(LanguageService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    price: ['', [Validators.required, Validators.min(0)]],
    duration: ['', [Validators.required, Validators.min(1), Validators.max(1440)]],
    description: ['', Validators.maxLength(500)],
    requiresPersonResource: [false],
    isActive: [true],
  });
  protected serviceId = '';
  protected loading = false;
  protected saving = false;
  protected submitted = false;
  protected priceFormatError = '';
  protected errorMessage = '';
  protected get editing(): boolean {
    return Boolean(this.serviceId);
  }
  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.serviceId) this.loadService();
  }
  protected submit(): void {
    if (this.saving) {
      return;
    }
    this.submitted = true;
    this.priceFormatError = '';
    this.form.controls.name.setValue(this.form.controls.name.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      name: value.name,
      description: value.description.trim(),
      pricePaise: Math.round(Number(value.price) * 100),
      durationMinutes: Number(value.duration),
      requiresPersonResource: value.requiresPersonResource,
      isActive: value.isActive,
    };
    if (!Number.isSafeInteger(payload.pricePaise)) {
      this.priceFormatError = this.language.translate('service.priceLarge');
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const request = this.editing
      ? this.service.updateService(this.serviceId, { ...payload, isActive: value.isActive })
      : this.service.createService(payload);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.saving = false)),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/app/services'),
        error: (error) =>
          (this.errorMessage =
            error.error?.message ?? this.language.translate('service.saveFailed')),
      });
  }
  protected cancel(): void {
    void this.router.navigateByUrl('/app/services');
  }
  protected fieldError(field: 'name' | 'price' | 'duration'): string {
    const control = this.form.controls[field];
    if (field === 'price' && this.priceFormatError) {
      return this.priceFormatError;
    }
    if (!control.invalid || (!control.touched && !this.submitted)) {
      return '';
    }
    if (control.hasError('required')) {
      return this.language.translate(
        field === 'name'
          ? 'service.nameRequired'
          : field === 'price'
            ? 'service.priceRequired'
            : 'service.durationRequired',
      );
    }
    if (control.hasError('min')) {
      return this.language.translate(
        field === 'price' ? 'service.priceNegative' : 'service.durationMinimum',
      );
    }
    if (control.hasError('max')) {
      return this.language.translate(field === 'name' ? 'service.nameMax' : 'service.durationMax');
    }
    return this.language.translate('service.validValue');
  }
  private loadService(): void {
    this.loading = true;
    this.service
      .getService(this.serviceId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: ({ service }) =>
          this.form.patchValue({
            name: service.name,
            price: String(service.pricePaise / 100),
            duration: String(service.durationMinutes),
            description: service.description ?? '',
            requiresPersonResource: service.requiresPersonResource,
            isActive: service.isActive,
          }),
        error: (error) =>
          (this.errorMessage =
            error.error?.message ?? this.language.translate('service.loadFailed')),
      });
  }
}
