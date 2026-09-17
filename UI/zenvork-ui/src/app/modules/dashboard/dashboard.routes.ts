import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    data: { title: 'Dashboard' },
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
  },
];
