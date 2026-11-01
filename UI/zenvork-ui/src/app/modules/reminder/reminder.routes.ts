import { Routes } from '@angular/router';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { reminderTranslations } from './i18n/reminder.translations';

export const reminderRoutes: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations(reminderTranslations)],
    data: { title: 'Reminders' },
    loadComponent: () =>
      import('./pages/reminder-list/reminder-list.component').then(
        (component) => component.ReminderListComponent,
      ),
  },
];
