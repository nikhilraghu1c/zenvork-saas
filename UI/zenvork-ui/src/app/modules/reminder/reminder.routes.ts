import { Routes } from '@angular/router';

export const reminderRoutes: Routes = [
  {
    path: '',
    data: { title: 'Reminders' },
    loadComponent: () =>
      import('./pages/reminder-list/reminder-list.component').then(
        (component) => component.ReminderListComponent,
      ),
  },
];
