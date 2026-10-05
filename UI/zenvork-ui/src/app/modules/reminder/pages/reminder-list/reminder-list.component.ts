import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { BusinessDateTimeService } from '../../../../core/services/business-date-time.service';
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
  ],
  templateUrl: './reminder-list.component.html',
  styleUrl: './reminder-list.component.scss',
})
export class ReminderListComponent implements OnInit {
  private readonly reminderService = inject(ReminderService);
  private readonly router = inject(Router);
  private readonly dateTime = inject(BusinessDateTimeService);

  protected readonly tabs: ReminderTabOption[] = [
    { value: 'to-send', label: 'To send', countLabel: 'To send' },
    { value: 'upcoming', label: 'Upcoming', countLabel: 'Upcoming' },
    { value: 'sent-today', label: 'Sent today', countLabel: 'Sent today' },
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
      { id: 'details', label: 'View booking', icon: 'open_in_new' },
    ];
    if (this.canAction(reminder))
      items.push({ id: 'skip', label: 'Skip reminder', icon: 'skip_next' });
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
    return reminder.status === 'PENDING' && this.selectedTab === 'to-send';
  }

  protected openWhatsApp(reminder: ReminderRecord): void {
    if (!reminder.client || !this.canAction(reminder)) return;
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
      this.successMessage = 'Reminder message copied.';
    } catch {
      this.errorMessage = 'Unable to copy the reminder message.';
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
        this.errorMessage = error.error?.message ?? 'Unable to update the reminder.';
      },
    });
  }

  protected appointmentLabel(reminder: ReminderRecord): string {
    return reminder.booking?.scheduledStartAt
      ? this.dateTime.format(reminder.booking.scheduledStartAt, 'dateTime')
      : 'Appointment time unavailable';
  }

  protected dueLabel(reminder: ReminderRecord): string {
    if (reminder.status === 'SENT') return this.sentLabel(reminder);
    return `Ready since ${this.dateTime.format(reminder.dueAt, 'dateTime')}`;
  }

  protected sentLabel(reminder: ReminderRecord): string {
    return reminder.resolvedAt
      ? `Sent ${this.dateTime.format(reminder.resolvedAt, 'time')}`
      : 'Sent today';
  }

  protected sectionEyebrow(): string {
    if (this.selectedTab === 'to-send') return 'READY TO SEND';
    if (this.selectedTab === 'upcoming') return 'FUTURE REMINDERS';
    return "TODAY'S ACTIVITY";
  }

  protected sectionTitle(): string {
    if (this.selectedTab === 'to-send') return 'Reminders to send';
    if (this.selectedTab === 'upcoming') return 'Scheduled reminders';
    return 'Reminders sent today';
  }

  protected emptyTitle(): string {
    if (this.selectedTab === 'to-send') return 'Nothing to send';
    if (this.selectedTab === 'upcoming') return 'Nothing upcoming';
    return 'No reminders sent today';
  }

  protected emptyDescription(): string {
    if (this.selectedTab === 'to-send') return 'No appointment reminders are ready to send.';
    if (this.selectedTab === 'upcoming')
      return 'New scheduled appointments will appear here before they are due.';
    return 'Confirmed WhatsApp reminders will appear here today.';
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
        this.errorMessage = error.error?.message ?? 'Unable to load reminders.';
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
