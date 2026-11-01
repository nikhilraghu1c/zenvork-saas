import { Routes } from '@angular/router';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { staffTranslations } from './i18n/staff.translations';

export const staffRoutes: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations(staffTranslations)],
    children: [
      {
        path: 'new',
        data: { title: 'Add Staff' },
        loadComponent: () =>
          import('./pages/staff-form/staff-form.component').then((m) => m.StaffFormComponent),
      },
      {
        path: ':id',
        data: { title: 'Staff Details' },
        loadComponent: () =>
          import('./pages/staff-details/staff-details.component').then(
            (m) => m.StaffDetailsComponent,
          ),
      },
      {
        path: '',
        data: { title: 'Staff' },
        loadComponent: () =>
          import('./pages/staff-list/staff-list.component').then((m) => m.StaffListComponent),
      },
    ],
  },
];
