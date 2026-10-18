import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-business-password-reset-dialog',
  imports: [AppButtonComponent],
  templateUrl: './business-password-reset-dialog.component.html',
  styleUrl: './business-password-reset-dialog.component.scss',
})
export class BusinessPasswordResetDialogComponent {
  @Input({ required: true }) businessName = '';
  @Input({ required: true }) ownerName = '';
  @Input() submitting = false;
  @Input() errorMessage = '';
  @Input() temporaryPassword = '';
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  protected close(): void {
    if (!this.submitting) this.closed.emit();
  }
}
