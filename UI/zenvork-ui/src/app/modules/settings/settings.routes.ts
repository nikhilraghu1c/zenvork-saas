import { Routes } from '@angular/router';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { settingsTranslations } from './i18n/settings.translations';

export const settingsRoutes: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations(settingsTranslations)],
    data: { title: 'Settings' },
    loadComponent: () => import('./settings.component').then((m) => m.SettingsComponent),
  },
];
