import { Routes } from '@angular/router';

const comingSoonRoute = (path: string, title: string): Routes[number] => ({
  path,
  data: { title },
  loadComponent: () => import('./coming-soon.component').then((m) => m.ComingSoonComponent),
});

export const comingSoonRoutes: Routes = [
  comingSoonRoute('settings', 'Settings'),
];
