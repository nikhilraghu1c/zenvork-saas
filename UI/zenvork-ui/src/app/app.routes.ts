import { Routes } from '@angular/router';
export const routes: Routes = [
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
