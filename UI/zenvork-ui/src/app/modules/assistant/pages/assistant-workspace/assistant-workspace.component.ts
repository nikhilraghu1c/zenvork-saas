import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppActionMenuComponent, AppActionMenuItem } from '../../../../shared/action-menu/action-menu.component';
import { AssistantConversationDialogComponent, AssistantConversationDialogMode } from '../../components/assistant-conversation-dialog/assistant-conversation-dialog.component';
import { AssistantConversationAction, AssistantHistorySheetComponent, AssistantHistorySheetResult } from '../../components/assistant-history-sheet/assistant-history-sheet.component';
import {
  AssistantConversation,
  AssistantConversationSummary,
  AssistantMessage,
  AssistantService,
} from '../../services/assistant.service';

interface PromptSuggestion {
  icon: string;
  label: string;
}

const CONVERSATION_ACTIONS: AppActionMenuItem[] = [
  { id: 'rename', label: 'Rename', icon: 'edit' },
  { id: 'delete', label: 'Delete', icon: 'delete' },
];

@Component({
  selector: 'app-assistant-workspace',
  imports: [AppActionMenuComponent, AppButtonComponent, AssistantConversationDialogComponent, MatBottomSheetModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './assistant-workspace.component.html',
  styleUrl: './assistant-workspace.component.scss',
})
export class AssistantWorkspaceComponent implements OnInit {
  @ViewChild('chatScroll') private chatScroll?: ElementRef<HTMLElement>;

  private readonly assistant = inject(AssistantService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly promptControl = new FormControl('', { nonNullable: true });
  protected readonly suggestions: PromptSuggestion[] = [
    { icon: 'help_outline', label: 'What can I ask?' },
    { icon: 'payments', label: 'How much revenue did I get yesterday?' },
    { icon: 'edit_note', label: 'Draft a reminder message' },
  ];

  protected conversations: AssistantConversationSummary[] = [];
  protected activeConversation: AssistantConversation | null = null;
  protected loadingConversations = true;
  protected loadingConversation = false;
  protected sending = false;
  protected pendingMessage = '';
  protected errorMessage = '';
  protected actionConversation: AssistantConversationSummary | null = null;
  protected actionMode: AssistantConversationDialogMode | null = null;
  protected actionSubmitting = false;
  protected actionError = '';
  protected readonly conversationActions = CONVERSATION_ACTIONS;
  ngOnInit(): void {
    this.loadConversations();
  }

  /** Opens the same private-session list as a bottom sheet when the desktop panel is unavailable. */
  protected openHistory(): void {
    const sheet = this.bottomSheet.open(AssistantHistorySheetComponent, {
      data: {
        conversations: this.conversations,
        selectedConversationId: this.activeConversation?._id ?? null,
      },
    });
    sheet
      .afterDismissed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: AssistantHistorySheetResult | undefined) => {
        if (result === 'new') this.startConversation();
        else if (typeof result === 'string') this.selectConversation(result);
        else if (result) this.requestConversationAction(result.conversation, result.action);
      });
  }

  /** Creates an empty private conversation without sending an AI request. */
  protected startConversation(): void {
    if (this.sending) return;
    this.errorMessage = '';
    this.assistant.createConversation().subscribe({
      next: ({ conversation }) => {
        this.activeConversation = conversation;
        this.conversations = [this.toSummary(conversation), ...this.conversations];
        this.promptControl.setValue('');
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ?? 'Unable to start a conversation.';
      },
    });
  }

  /** Loads one private conversation after checking its server-derived tenant and user ownership. */
  protected selectConversation(id: string): void {
    if (this.activeConversation?._id === id || this.loadingConversation) return;
    this.errorMessage = '';
    this.loadingConversation = true;
    this.assistant.getConversation(id).subscribe({
      next: ({ conversation }) => {
        this.activeConversation = conversation;
        this.loadingConversation = false;
        this.scrollToLatest();
      },
      error: (error: { error?: { message?: string } }) => {
        this.loadingConversation = false;
        this.errorMessage = error.error?.message ?? 'Unable to load the conversation.';
      },
    });
  }

  /** Uses a starter prompt as the next user message. */
  protected useSuggestion(suggestion: PromptSuggestion): void {
    if (this.sending) return;
    this.promptControl.setValue(suggestion.label);
    this.sendMessage();
  }

  /** Sends a prompt, creating the first private session only when one does not yet exist. */
  protected sendMessage(): void {
    const content = this.promptControl.value.trim();
    if (!content || this.sending) return;
    this.errorMessage = '';
    this.sending = true;
    this.pendingMessage = content;

    if (this.activeConversation) {
      this.sendToConversation(this.activeConversation._id, content);
      return;
    }

    this.assistant.createConversation().subscribe({
      next: ({ conversation }) => this.sendToConversation(conversation._id, content),
      error: (error: { error?: { message?: string } }) => {
        this.sending = false;
        this.pendingMessage = '';
        this.errorMessage = error.error?.message ?? 'Unable to start a conversation.';
      },
    });
  }

  /** Sends on Enter while preserving Shift+Enter for multi-line prompts. */
  protected handleComposerKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) return;
    event.preventDefault();
    this.sendMessage();
  }

  /** Sends the text to the server so retention is extended only by persisted conversation activity. */
  private sendToConversation(id: string, content: string): void {
    this.assistant.sendMessage(id, content).subscribe({
      next: ({ conversation }) => {
        this.activeConversation = conversation;
        this.conversations = [
          this.toSummary(conversation),
          ...this.conversations.filter((item) => item._id !== conversation._id),
        ];
        this.promptControl.setValue('');
        this.sending = false;
        this.pendingMessage = '';
        this.scrollToLatest();
      },
      error: (error: { error?: { message?: string } }) => {
        this.sending = false;
        this.pendingMessage = '';
        this.errorMessage = error.error?.message ?? 'Unable to send the message.';
      },
    });
  }

  private loadConversations(): void {
    this.assistant.getConversations().subscribe({
      next: ({ conversations }) => {
        this.conversations = conversations;
        this.loadingConversations = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.loadingConversations = false;
        this.errorMessage = error.error?.message ?? 'Unable to load conversations.';
      },
    });
  }

  protected isSelected(id: string): boolean {
    return this.activeConversation?._id === id;
  }

  /** Opens the local confirmation dialog; server ownership is still enforced on submission. */
  protected requestConversationAction(conversation: AssistantConversationSummary, action: string): void {
    if (action !== 'rename' && action !== 'delete') return;
    this.actionConversation = conversation;
    this.actionMode = action as AssistantConversationAction;
    this.actionError = '';
  }

  protected closeConversationDialog(): void {
    if (this.actionSubmitting) return;
    this.actionConversation = null;
    this.actionMode = null;
    this.actionError = '';
  }

  protected confirmConversationDialog(title: string): void {
    if (!this.actionConversation || !this.actionMode || this.actionSubmitting) return;
    this.actionSubmitting = true;
    this.actionError = '';
    if (this.actionMode === 'rename') {
      this.assistant.updateConversation(this.actionConversation._id, title).subscribe({
        next: ({ conversation }) => {
          this.conversations = this.conversations.map((item) => item._id === conversation._id ? this.toSummary(conversation) : item);
          if (this.activeConversation?._id === conversation._id) this.activeConversation = conversation;
          this.actionSubmitting = false;
          this.closeConversationDialog();
        },
        error: (error: { error?: { message?: string } }) => {
          this.actionSubmitting = false;
          this.actionError = error.error?.message ?? 'Unable to rename the conversation.';
        },
      });
      return;
    }
    const id = this.actionConversation._id;
    this.assistant.deleteConversation(id).subscribe({
      next: () => {
        this.conversations = this.conversations.filter((item) => item._id !== id);
        if (this.activeConversation?._id === id) this.activeConversation = null;
        this.actionSubmitting = false;
        this.closeConversationDialog();
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionSubmitting = false;
        this.actionError = error.error?.message ?? 'Unable to delete the conversation.';
      },
    });
  }

  protected messageTime(message: AssistantMessage): string {
    return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(
      new Date(message.createdAt),
    );
  }

  private toSummary(conversation: AssistantConversation): AssistantConversationSummary {
    const { _id, title, lastMessageAt, createdAt } = conversation;
    return { _id, title, lastMessageAt, createdAt };
  }

  /** Waits for Angular to render the saved response before moving the message viewport to it. */
  private scrollToLatest(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = this.chatScroll?.nativeElement;
        if (!element) return;
        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
      });
    });
  }
}
