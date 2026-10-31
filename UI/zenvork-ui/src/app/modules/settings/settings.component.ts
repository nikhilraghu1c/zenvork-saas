import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { AppButtonComponent } from '../../shared/button/button.component';
import { AppInputComponent } from '../../shared/input/input.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

const isStrongPassword = (value: string): boolean =>
  value.length >= 8 &&
  value.length <= 128 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

const strongPasswordValidator = (control: AbstractControl): ValidationErrors | null =>
  isStrongPassword(String(control.value ?? '')) ? null : { strength: true };

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    TranslatePipe,
    LanguageSwitcherComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);

  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', Validators.required],
  });
  protected submitted = false;
  protected loading = false;
  protected errorMessage = '';
  protected successMessage = '';

  /** Validates the current password and submits a strong replacement password. */
  protected submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.passwordForm.invalid || !this.passwordsMatch() || !this.passwordDiffersFromCurrent()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.auth
      .changePassword({ currentPassword, newPassword })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ message }) => {
          this.successMessage = message;
          this.passwordForm.reset();
          this.submitted = false;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.error?.message ?? this.language.translate('settings.passwordChangeFailed');
        },
      });
  }

  /** Provides concise validation feedback without exposing any password value. */
  protected fieldError(field: 'currentPassword' | 'newPassword' | 'confirmPassword'): string {
    const control = this.passwordForm.controls[field];
    if (!(this.submitted || control.touched)) {
      return '';
    }
    if (control.hasError('required')) {
      return this.language.translate('settings.required');
    }
    if (control.hasError('strength')) {
      return this.language.translate('settings.passwordStrength');
    }
    if (field === 'newPassword' && !this.passwordDiffersFromCurrent()) {
      return this.language.translate('settings.passwordMustDiffer');
    }
    if (field === 'confirmPassword' && !this.passwordsMatch()) {
      return this.language.translate('settings.passwordsDoNotMatch');
    }
    return '';
  }

  private passwordsMatch(): boolean {
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    return newPassword === confirmPassword;
  }

  private passwordDiffersFromCurrent(): boolean {
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    return currentPassword !== newPassword;
  }
}
