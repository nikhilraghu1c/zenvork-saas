import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: 'register-business', pathMatch: 'full', redirectTo: 'businesses/new' },
  {
    path: 'businesses/new',
    loadComponent: () =>
      import('./pages/business-form/business-form.component').then((m) => m.BusinessFormComponent),
    data: { title: 'Register Business' },
  },
  {
    path: 'businesses',
    loadComponent: () =>
      import('./pages/business-list/business-list.component').then((m) => m.BusinessListComponent),
    data: { title: 'Businesses' },
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    data: { title: 'Dashboard' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
