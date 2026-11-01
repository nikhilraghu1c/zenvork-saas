import { Routes } from '@angular/router';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { dashboardTranslations } from './i18n/dashboard.translations';

export const dashboardRoutes: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations(dashboardTranslations)],
    data: { title: 'Dashboard' },
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
  },
];
