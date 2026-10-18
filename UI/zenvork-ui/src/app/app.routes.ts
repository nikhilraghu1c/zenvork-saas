import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { ownerGuard } from './core/guards/owner-guard';
import { reminderAccessGuard } from './core/guards/reminder-access-guard';
import { platformAdminGuard } from './core/guards/platform-admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [platformAdminGuard],
    loadComponent: () =>
      import('./layouts/app-layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./modules/admin/admin.routes').then((m) => m.adminRoutes),
      },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/app-layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./modules/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },
      {
        path: 'booking',
        loadChildren: () => import('./modules/booking/booking.routes').then((m) => m.bookingRoutes),
      },
      {
        path: 'clients',
        loadChildren: () => import('./modules/client/client.routes').then((m) => m.clientRoutes),
      },
      {
        path: 'staff',
        canActivate: [ownerGuard],
        loadChildren: () => import('./modules/staff/staff.routes').then((m) => m.staffRoutes),
      },
      {
        path: 'resources',
        loadChildren: () =>
          import('./modules/resources/resource.routes').then((m) => m.resourceRoutes),
      },
      {
        path: 'services',
        loadChildren: () => import('./modules/service/service.routes').then((m) => m.serviceRoutes),
      },
      {
        path: 'analytics',
        canActivate: [ownerGuard],
        loadChildren: () =>
          import('./modules/analytics/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
      },
      {
        path: 'reminders',
        canActivate: [reminderAccessGuard],
        loadChildren: () =>
          import('./modules/reminder/reminder.routes').then((m) => m.reminderRoutes),
      },
      {
        path: 'ai-assistant',
        loadChildren: () =>
          import('./modules/assistant/assistant.routes').then((m) => m.assistantRoutes),
      },
      {
        path: 'settings',
        loadChildren: () => import('./modules/settings/settings.routes').then((m) => m.settingsRoutes),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent,
      ),
    children: [
      {
        path: 'login',
        loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.authRoutes),
      },
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () => import('./modules/landing/landing.routes').then((m) => m.landingRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
