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
        loadChildren: () => import('./modules/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
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
        loadChildren: () => import('./modules/resources/resource.routes').then((m) => m.resourceRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/coming-soon/coming-soon.routes').then((m) => m.comingSoonRoutes),
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
        loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.authRoutes),
      },
      {
        path: 'register',
        loadChildren: () => import('./modules/register/register.routes').then((m) => m.registerRoutes),
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
