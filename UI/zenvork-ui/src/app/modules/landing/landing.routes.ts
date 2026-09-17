import { Routes } from '@angular/router';

export const landingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing.component').then((m) => m.LandingComponent),
  },
];
