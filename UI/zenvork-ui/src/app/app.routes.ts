import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
export const routes: Routes = [
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/app-layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: 'dashboard',
        data: { title: 'Dashboard' },
        loadComponent: () =>
          import('./modules/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'booking',
        data: { title: 'Booking' },
        loadComponent: () =>
          import('./modules/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'clients',
        data: { title: 'Clients' },
        loadComponent: () =>
          import('./modules/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'staff-resources',
        data: { title: 'Staff & Resources' },
        loadComponent: () =>
          import('./modules/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'reminders',
        data: { title: 'Reminders' },
        loadComponent: () =>
          import('./modules/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'chat',
        data: { title: 'Chat' },
        loadComponent: () =>
          import('./modules/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'ai-assistant',
        data: { title: 'AI Assistant' },
        loadComponent: () =>
          import('./modules/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'analytics',
        data: { title: 'Analytics' },
        loadComponent: () =>
          import('./modules/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'settings',
        data: { title: 'Settings' },
        loadComponent: () =>
          import('./modules/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./modules/auth/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./modules/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: '',
        loadComponent: () =>
          import('./modules/landing/landing.component').then((m) => m.LandingComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
