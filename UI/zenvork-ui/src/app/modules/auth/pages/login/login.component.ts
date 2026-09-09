import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/checkbox/checkbox.component';
import { AppInputComponent } from '../../../../shared/input/input.component';

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
  /** Reactive form ready for the authentication API integration. */
  protected readonly loginForm;
  /** Enables validation feedback after the first submit attempt. */
  protected submitted = false;

  constructor(private readonly formBuilder: FormBuilder) {
    this.loginForm = this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: false,
    });
  }

  /** Validates credentials locally; API submission will be added with the backend login flow. */
  protected submit(): void {
    this.submitted = true;
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) return;
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
