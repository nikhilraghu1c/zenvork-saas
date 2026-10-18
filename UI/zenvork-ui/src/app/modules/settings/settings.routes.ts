import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    data: { title: 'Settings' },
    loadComponent: () => import('./settings.component').then((m) => m.SettingsComponent),
  },
];
