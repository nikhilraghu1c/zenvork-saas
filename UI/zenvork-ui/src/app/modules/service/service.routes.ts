import { Routes } from '@angular/router';
import { ownerGuard } from '../../core/guards/owner-guard';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { serviceTranslations } from './i18n/service.translations';

export const serviceRoutes: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations(serviceTranslations)],
    children: [
      {
        path: 'new',
        canActivate: [ownerGuard],
        data: { title: 'Add Service' },
        loadComponent: () =>
          import('./pages/service-form/service-form.component').then((m) => m.ServiceFormComponent),
      },
      {
        path: ':id/edit',
        canActivate: [ownerGuard],
        data: { title: 'Edit Service' },
        loadComponent: () =>
          import('./pages/service-form/service-form.component').then((m) => m.ServiceFormComponent),
      },
      {
        path: ':id',
        data: { title: 'Service Details' },
        loadComponent: () =>
          import('./pages/service-detail/service-detail.component').then(
            (m) => m.ServiceDetailComponent,
          ),
      },
      {
        path: '',
        data: { title: 'Services' },
        loadComponent: () =>
          import('./pages/service-list/service-list.component').then((m) => m.ServiceListComponent),
      },
    ],
  },
];
