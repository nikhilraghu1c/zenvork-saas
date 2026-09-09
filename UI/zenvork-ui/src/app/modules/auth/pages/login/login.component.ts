import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/checkbox/checkbox.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    RouterLink,
    AppButtonComponent,
    AppCheckboxComponent,
    AppInputComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  /** Reactive form that mirrors the login API payload plus local UI preferences. */
  protected readonly loginForm;
  /** Enables validation feedback after the first submit attempt. */
  protected submitted = false;
  /** Prevents duplicate login requests while the server responds. */
  protected loading = false;
  /** Error message returned by the login API. */
  protected serverError = '';
  /** Success message returned after the server creates the cookie session. */
  protected successMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly auth: AuthService,
  ) {
    this.loginForm = this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: false,
    });
  }

  /** Validates credentials locally, then starts the backend cookie session. */
  protected submit(): void {
    this.submitted = true;
    this.serverError = '';
    this.successMessage = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.getRawValue();
    const credentials: LoginRequest = { email, password };

    this.auth
      .login(credentials)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loginForm.disable();
        },
        error: (error: HttpErrorResponse) => {
          this.serverError = error.error?.message ?? 'Unable to log in. Please try again.';
        },
      });
  }

  /** Returns the appropriate user-facing validation message for one form control. */
  protected fieldError(field: 'email' | 'password'): string {
    const control = this.loginForm.controls[field];
    if (!control.errors || !(this.submitted || control.touched)) {
      return '';
    }

    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';
    return 'Enter a valid value.';
  }
}
