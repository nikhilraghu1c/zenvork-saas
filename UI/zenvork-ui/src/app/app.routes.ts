import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { ownerGuard } from './core/guards/owner-guard';
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
        path: 'staff/new',
        canActivate: [ownerGuard],
        data: { title: 'Add Staff' },
        loadComponent: () =>
          import('./modules/staff/pages/staff-form/staff-form.component').then((m) => m.StaffFormComponent),
      },
      {
        path: 'staff/:id',
        canActivate: [ownerGuard],
        data: { title: 'Staff Details' },
        loadComponent: () =>
          import('./modules/staff/pages/staff-details/staff-details.component').then((m) => m.StaffDetailsComponent),
      },
      {
        path: 'staff',
        canActivate: [ownerGuard],
        data: { title: 'Staff' },
        loadComponent: () =>
          import('./modules/staff/pages/staff-list/staff-list.component').then((m) => m.StaffListComponent),
      },
      {
        path: 'resources/new',
        canActivate: [ownerGuard],
        data: { title: 'Add Resource' },
        loadComponent: () => import('./modules/resources/pages/resource-form/resource-form.component').then(m => m.ResourceFormComponent),
      },
      {
        path: 'resources/:id',
        data: { title: 'Resource Details' },
        loadComponent: () => import('./modules/resources/pages/resource-details/resource-details.component').then(m => m.ResourceDetailsComponent),
      },
      {
        path: 'resources',
        data: { title: 'Resources' },
        loadComponent: () => import('./modules/resources/pages/resource-list/resource-list.component').then(m => m.ResourceListComponent),
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
