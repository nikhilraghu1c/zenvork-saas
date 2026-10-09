import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppButtonComponent } from '../../../../shared/button/button.component';

export type AssistantConversationDialogMode = 'rename' | 'delete';

@Component({
  selector: 'app-assistant-conversation-dialog',
  imports: [AppButtonComponent, ReactiveFormsModule],
  templateUrl: './assistant-conversation-dialog.component.html',
  styleUrl: './assistant-conversation-dialog.component.scss',
})
export class AssistantConversationDialogComponent {
  @Input({ required: true }) mode: AssistantConversationDialogMode = 'rename';
  @Input() submitting = false;
  @Input() errorMessage = '';
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<string>();

  protected readonly titleControl = new FormControl('', { nonNullable: true });

  @Input()
  set conversationTitle(value: string) {
    this.titleControl.setValue(value);
  }

  /** Emits a trimmed title only after the user confirms the rename. */
  protected confirmRename(): void {
    const title = this.titleControl.value.trim();
    if (title && !this.submitting) this.confirmed.emit(title);
  }

  /** Keeps destructive actions behind an explicit confirmation click. */
  protected confirmDelete(): void {
    if (!this.submitting) this.confirmed.emit('');
  }

  protected close(): void {
    if (!this.submitting) this.closed.emit();
  }
}
