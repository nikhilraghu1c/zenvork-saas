import { Routes } from '@angular/router';

const comingSoonRoute = (path: string, title: string): Routes[number] => ({
  path,
  data: { title },
  loadComponent: () => import('./coming-soon.component').then((m) => m.ComingSoonComponent),
});

export const comingSoonRoutes: Routes = [
  comingSoonRoute('reminders', 'Reminders'),
  comingSoonRoute('chat', 'Chat'),
  comingSoonRoute('ai-assistant', 'AI Assistant'),
  comingSoonRoute('analytics', 'Analytics'),
  comingSoonRoute('settings', 'Settings'),
];
