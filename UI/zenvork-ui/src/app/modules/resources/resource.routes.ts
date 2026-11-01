import { Routes } from '@angular/router';
import { ownerGuard } from '../../core/guards/owner-guard';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { resourcesTranslations } from './i18n/resources.translations';

export const resourceRoutes: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations(resourcesTranslations)],
    children: [
      {
        path: 'new',
        canActivate: [ownerGuard],
        data: { title: 'Add Resource' },
        loadComponent: () =>
          import('./pages/resource-form/resource-form.component').then(
            (m) => m.ResourceFormComponent,
          ),
      },
      {
        path: ':id',
        data: { title: 'Resource Details' },
        loadComponent: () =>
          import('./pages/resource-details/resource-details.component').then(
            (m) => m.ResourceDetailsComponent,
          ),
      },
      {
        path: '',
        data: { title: 'Resources' },
        loadComponent: () =>
          import('./pages/resource-list/resource-list.component').then(
            (m) => m.ResourceListComponent,
          ),
      },
    ],
  },
];
