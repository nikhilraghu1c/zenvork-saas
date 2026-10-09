import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export type AssistantMessageRole = 'USER' | 'ASSISTANT';

export interface AssistantMessage {
  _id: string;
  role: AssistantMessageRole;
  content: string;
  createdAt: string;
}

export interface AssistantConversationSummary {
  _id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface AssistantConversation extends AssistantConversationSummary {
  messages: AssistantMessage[];
}

interface AssistantConversationResponse {
  conversation: AssistantConversation;
}

interface AssistantConversationListResponse {
  conversations: AssistantConversationSummary[];
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  constructor(private readonly api: ApiService) {}

  /** Loads only the current user's private conversation summaries in their authenticated tenant. */
  getConversations(): Observable<AssistantConversationListResponse> {
    return this.api.get<AssistantConversationListResponse>('assistant/conversations');
  }

  /** Creates an empty private conversation before the user sends their first message. */
  createConversation(): Observable<AssistantConversationResponse> {
    return this.api.post<AssistantConversationResponse, Record<string, never>>(
      'assistant/conversations',
      {},
    );
  }

  /** Loads a selected conversation and its embedded message history. */
  getConversation(id: string): Observable<AssistantConversationResponse> {
    return this.api.get<AssistantConversationResponse>(`assistant/conversations/${id}`);
  }

  /** Renames one private conversation after backend ownership and title validation. */
  updateConversation(id: string, title: string): Observable<AssistantConversationResponse> {
    return this.api.patch<AssistantConversationResponse, { title: string }>(
      `assistant/conversations/${id}`,
      { title },
    );
  }

  /** Persists a user prompt and receives Phase 1's controlled assistant response. */
  sendMessage(id: string, content: string): Observable<AssistantConversationResponse> {
    return this.api.post<AssistantConversationResponse, { content: string }>(
      `assistant/conversations/${id}/messages`,
      { content },
    );
  }

  /** Permanently deletes one private conversation and all of its embedded messages. */
  deleteConversation(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`assistant/conversations/${id}`);
  }
}
