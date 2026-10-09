import { Component, Inject } from '@angular/core';
import { MatBottomSheetModule, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppActionMenuComponent, AppActionMenuItem } from '../../../../shared/action-menu/action-menu.component';
import { AssistantConversationSummary } from '../../services/assistant.service';

export type AssistantConversationAction = 'rename' | 'delete';
export type AssistantHistorySheetResult =
  | string
  | 'new'
  | { action: AssistantConversationAction; conversation: AssistantConversationSummary };

const CONVERSATION_ACTIONS: AppActionMenuItem[] = [
  { id: 'rename', label: 'Rename', icon: 'edit' },
  { id: 'delete', label: 'Delete', icon: 'delete' },
];

export interface AssistantHistorySheetData {
  conversations: AssistantConversationSummary[];
  selectedConversationId: string | null;
}

@Component({
  selector: 'app-assistant-history-sheet',
  imports: [AppActionMenuComponent, AppButtonComponent, MatBottomSheetModule, MatIconModule],
  templateUrl: './assistant-history-sheet.component.html',
  styleUrl: './assistant-history-sheet.component.scss',
})
export class AssistantHistorySheetComponent {
  constructor(
    private readonly sheetRef: MatBottomSheetRef<AssistantHistorySheetComponent, AssistantHistorySheetResult | undefined>,
    @Inject(MAT_BOTTOM_SHEET_DATA) protected readonly data: AssistantHistorySheetData,
  ) {}

  protected readonly conversationActions = CONVERSATION_ACTIONS;

  /** Starts a blank session after closing the mobile history overlay. */
  protected startConversation(): void {
    this.sheetRef.dismiss('new');
  }

  /** Returns the selected session ID to the workspace after closing the mobile overlay. */
  protected selectConversation(id: string): void {
    this.sheetRef.dismiss(id);
  }

  /** Returns the chosen action and private conversation summary to the workspace. */
  protected selectAction(conversation: AssistantConversationSummary, action: string): void {
    if (action === 'rename' || action === 'delete') this.sheetRef.dismiss({ action, conversation });
  }

  protected isSelected(id: string): boolean {
    return this.data.selectedConversationId === id;
  }

}
