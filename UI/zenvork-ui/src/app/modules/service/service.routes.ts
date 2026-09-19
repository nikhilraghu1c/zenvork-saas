import { Routes } from '@angular/router';
import { ownerGuard } from '../../core/guards/owner-guard';

export const serviceRoutes: Routes = [
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
];
