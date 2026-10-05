import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiQuery, ApiService } from '../../../core/services/api.service';

export type ReminderTab = 'to-send' | 'upcoming' | 'sent-today';
export type ReminderAction = 'sent' | 'skipped';

export interface ReminderClientSummary {
  _id: string;
  name: string;
  mobile: string;
}

export interface ReminderBookingSummary {
  _id: string;
  scheduledStartAt: string;
  services: { name: string }[];
  resources: { _id: string; name: string; resourceType: string }[];
}

export interface ReminderRecord {
  _id: string;
  status: 'PENDING' | 'SENT' | 'SKIPPED' | 'CANCELLED' | 'EXPIRED';
  dueAt: string;
  expiresAt: string;
  resolvedAt: string | null;
  client: ReminderClientSummary | null;
  booking: ReminderBookingSummary | null;
}

export interface ReminderListQuery extends ApiQuery {
  tab?: ReminderTab;
  page?: number;
  limit?: number;
}

export interface ReminderListResponse {
  reminders: ReminderRecord[];
  counts: {
    toSend: number;
    upcoming: number;
    sentToday: number;
  };
  pagination: { page: number; limit: number; total: number };
}

export interface ReminderActionResponse {
  message: string;
  reminder: { _id: string; status: ReminderRecord['status']; resolvedAt: string };
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
  constructor(private readonly api: ApiService) {}

  /** Loads one reminder workspace tab plus the current business's counts. */
  getReminders(query: ReminderListQuery): Observable<ReminderListResponse> {
    return this.api.query<ReminderListResponse>('reminders', query);
  }

  /** Records a staff-confirmed manual send or intentional skip. */
  updateReminder(id: string, action: ReminderAction): Observable<ReminderActionResponse> {
    return this.api.patch<ReminderActionResponse, { action: ReminderAction }>(`reminders/${id}`, {
      action,
    });
  }
}
