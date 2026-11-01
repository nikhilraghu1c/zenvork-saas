import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { BusinessDateTimeService } from '../../../../core/services/business-date-time.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { ReminderSendConfirmationDialogComponent } from '../../components/reminder-send-confirmation-dialog/reminder-send-confirmation-dialog.component';
import {
  ReminderAction,
  ReminderRecord,
  ReminderService,
  ReminderTab,
} from '../../services/reminder.service';

interface ReminderTabOption {
  value: ReminderTab;
  label: string;
  countLabel: string;
}

@Component({
  selector: 'app-reminder-list',
  imports: [
    AppActionMenuComponent,
    AppButtonComponent,
    MatIconModule,
    ReminderSendConfirmationDialogComponent,
    TranslatePipe,
  ],
  templateUrl: './reminder-list.component.html',
  styleUrl: './reminder-list.component.scss',
})
export class ReminderListComponent implements OnInit {
  private readonly reminderService = inject(ReminderService);
  private readonly router = inject(Router);
  private readonly dateTime = inject(BusinessDateTimeService);
  private readonly language = inject(LanguageService);

  protected readonly tabs: ReminderTabOption[] = [
    { value: 'to-send', label: this.language.translate('reminder.toSend'), countLabel: this.language.translate('reminder.toSend') },
    { value: 'upcoming', label: this.language.translate('reminder.upcoming'), countLabel: this.language.translate('reminder.upcoming') },
    { value: 'sent-today', label: this.language.translate('reminder.sentToday'), countLabel: this.language.translate('reminder.sentToday') },
  ];
  protected selectedTab: ReminderTab = 'to-send';
  protected reminders: ReminderRecord[] = [];
  protected counts = { toSend: 0, upcoming: 0, sentToday: 0 };
  protected loading = true;
  protected errorMessage = '';
  protected successMessage = '';
  protected actionReminderId = '';
  protected whatsappConfirmationReminder: ReminderRecord | null = null;

  ngOnInit(): void {
    this.loadReminders();
  }

  protected selectTab(tab: ReminderTab): void {
    if (this.selectedTab === tab || this.loading) return;
    this.selectedTab = tab;
    this.successMessage = '';
    this.loadReminders();
  }

  protected isSelected(tab: ReminderTab): boolean {
    return this.selectedTab === tab;
  }

  protected tabCount(tab: ReminderTab): number {
    if (tab === 'to-send') return this.counts.toSend;
    if (tab === 'sent-today') return this.counts.sentToday;
    return this.counts.upcoming;
  }

  protected actionMenuItems(reminder: ReminderRecord): AppActionMenuItem[] {
    const items: AppActionMenuItem[] = [
      { id: 'details', label: this.language.translate('reminder.viewBooking'), icon: 'open_in_new' },
    ];
    if (this.canAction(reminder))
      items.push({ id: 'skip', label: this.language.translate('reminder.skip'), icon: 'skip_next' });
    return items;
  }

  protected handleMenuAction(action: string, reminder: ReminderRecord): void {
    if (action === 'details' && reminder.booking) {
      void this.router.navigate(['/app/booking', reminder.booking._id]);
    }
    if (action === 'skip') this.updateReminder(reminder, 'skipped');
  }

  /** Only the dedicated To send queue permits manual reminder actions. */
  protected canAction(reminder: ReminderRecord): boolean {
    return (
      reminder.status === 'PENDING' &&
      this.selectedTab === 'to-send'
    );
  }

  protected openWhatsApp(reminder: ReminderRecord): void {
    if (!reminder.client?.mobile || !this.canAction(reminder)) return;
    const phone = reminder.client.mobile.replace(/\D/g, '');
    const message = encodeURIComponent(this.messageFor(reminder));
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
    this.errorMessage = '';
    this.whatsappConfirmationReminder = reminder;
  }

  protected closeWhatsAppConfirmation(): void {
    if (!this.actionReminderId) this.whatsappConfirmationReminder = null;
  }

  protected confirmWhatsAppSend(): void {
    if (!this.whatsappConfirmationReminder) return;
    this.updateReminder(this.whatsappConfirmationReminder, 'sent', () => {
      this.whatsappConfirmationReminder = null;
    });
  }

  protected async copyMessage(reminder: ReminderRecord): Promise<void> {
    if (!this.canAction(reminder)) return;
    try {
      await navigator.clipboard.writeText(this.messageFor(reminder));
      this.successMessage = this.language.translate('reminder.copied');
    } catch {
      this.errorMessage = this.language.translate('reminder.copyFailed');
    }
  }

  protected updateReminder(
    reminder: ReminderRecord,
    action: ReminderAction,
    onSuccess?: () => void,
  ): void {
    if (!this.canAction(reminder) || this.actionReminderId) return;
    this.actionReminderId = reminder._id;
    this.errorMessage = '';
    this.successMessage = '';
    this.reminderService.updateReminder(reminder._id, action).subscribe({
      next: ({ message }) => {
        this.actionReminderId = '';
        this.successMessage = message;
        onSuccess?.();
        this.loadReminders();
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionReminderId = '';
        this.errorMessage = error.error?.message ?? this.language.translate('reminder.updateFailed');
      },
    });
  }

  protected appointmentLabel(reminder: ReminderRecord): string {
    return reminder.booking?.scheduledStartAt
      ? this.dateTime.format(reminder.booking.scheduledStartAt, 'dateTime')
      : this.language.translate('reminder.timeUnavailable');
  }

  protected dueLabel(reminder: ReminderRecord): string {
    if (reminder.status === 'SENT') return this.sentLabel(reminder);
    return `${this.language.translate('reminder.readySince')} ${this.dateTime.format(reminder.dueAt, 'dateTime')}`;
  }

  protected sentLabel(reminder: ReminderRecord): string {
    return reminder.resolvedAt
      ? `${this.language.translate('reminder.sent')} ${this.dateTime.format(reminder.resolvedAt, 'time')}`
      : this.language.translate('reminder.sentToday');
  }

  protected sectionEyebrow(): string {
    if (this.selectedTab === 'to-send') return this.language.translate('reminder.readyToSend');
    if (this.selectedTab === 'upcoming') return this.language.translate('reminder.futureReminders');
    return this.language.translate('reminder.todayActivity');
  }

  protected sectionTitle(): string {
    if (this.selectedTab === 'to-send') return this.language.translate('reminder.remindersToSend');
    if (this.selectedTab === 'upcoming') return this.language.translate('reminder.scheduledReminders');
    return this.language.translate('reminder.remindersSentToday');
  }

  protected emptyTitle(): string {
    if (this.selectedTab === 'to-send') return this.language.translate('reminder.nothingToSend');
    if (this.selectedTab === 'upcoming') return this.language.translate('reminder.nothingUpcoming');
    return this.language.translate('reminder.noneSentToday');
  }

  protected emptyDescription(): string {
    if (this.selectedTab === 'to-send') return this.language.translate('reminder.noneReady');
    if (this.selectedTab === 'upcoming')
      return this.language.translate('reminder.noneUpcoming');
    return this.language.translate('reminder.noneSent');
  }

  private loadReminders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.reminderService.getReminders({ tab: this.selectedTab, limit: 25 }).subscribe({
      next: (response) => {
        this.reminders = response.reminders;
        this.counts = response.counts;
        this.loading = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.reminders = [];
        this.loading = false;
        this.errorMessage = error.error?.message ?? this.language.translate('reminder.loadFailed');
      },
    });
  }

  private messageFor(reminder: ReminderRecord): string {
    const clientName = reminder.client?.name ?? 'there';
    const services =
      reminder.booking?.services.map((service) => service.name).join(', ') || 'appointment';
    return `Hi ${clientName}, this is a reminder for your ${services} on ${this.appointmentLabel(reminder)}. We look forward to seeing you.`;
  }
}
