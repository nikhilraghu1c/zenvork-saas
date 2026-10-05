import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-reminder-send-confirmation-dialog',
  imports: [AppButtonComponent],
  templateUrl: './reminder-send-confirmation-dialog.component.html',
  styleUrl: './reminder-send-confirmation-dialog.component.scss',
})
export class ReminderSendConfirmationDialogComponent {
  @Input({ required: true }) clientName = '';
  @Input() submitting = false;
  @Input() errorMessage = '';
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  protected close(): void {
    if (!this.submitting) this.closed.emit();
  }
}
