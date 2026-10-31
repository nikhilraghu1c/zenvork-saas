import { Routes } from '@angular/router';
import { ownerGuard } from '../../core/guards/owner-guard';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { clientTranslations } from './i18n/client.translations';

export const clientRoutes: Routes = [
  {
    path: '',
    canActivate: [ownerGuard],
    providers: [provideFeatureTranslations(clientTranslations)],
    data: { title: 'Clients' },
    loadComponent: () =>
      import('./pages/client-list/client-list.component').then((m) => m.ClientListComponent),
  },
];
