import { Routes } from '@angular/router';
import { ownerGuard } from '../../core/guards/owner-guard';

export const resourceRoutes: Routes = [
  {
    path: 'new',
    canActivate: [ownerGuard],
    data: { title: 'Add Resource' },
    loadComponent: () =>
      import('./pages/resource-form/resource-form.component').then((m) => m.ResourceFormComponent),
  },
  {
    path: ':id',
    data: { title: 'Resource Details' },
    loadComponent: () =>
      import('./pages/resource-details/resource-details.component').then((m) => m.ResourceDetailsComponent),
  },
  {
    path: '',
    data: { title: 'Resources' },
    loadComponent: () =>
      import('./pages/resource-list/resource-list.component').then((m) => m.ResourceListComponent),
  },
];
