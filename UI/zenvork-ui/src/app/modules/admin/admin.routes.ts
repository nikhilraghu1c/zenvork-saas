import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: 'register-business', pathMatch: 'full', redirectTo: 'businesses/new' },
  {
    path: 'businesses/new',
    loadComponent: () =>
      import('./pages/business-form/business-form.component').then((m) => m.BusinessFormComponent),
    data: { title: 'Register Business' },
  },
  {
    path: 'businesses',
    loadComponent: () =>
      import('./pages/business-list/business-list.component').then((m) => m.BusinessListComponent),
    data: { title: 'Businesses' },
  },
  {
    path: 'business-types/new',
    loadComponent: () =>
      import('./pages/business-type-form/business-type-form.component').then(
        (m) => m.BusinessTypeFormComponent,
      ),
    data: { title: 'Add Business Type' },
  },
  {
    path: 'business-types/:id/edit',
    loadComponent: () =>
      import('./pages/business-type-form/business-type-form.component').then(
        (m) => m.BusinessTypeFormComponent,
      ),
    data: { title: 'Edit Business Type' },
  },
  {
    path: 'business-types',
    loadComponent: () =>
      import('./pages/business-type-list/business-type-list.component').then(
        (m) => m.BusinessTypeListComponent,
      ),
    data: { title: 'Business Types' },
  },
  {
    path: 'resource-types/new',
    loadComponent: () =>
      import('./pages/resource-type-form/resource-type-form.component').then(
        (m) => m.ResourceTypeFormComponent,
      ),
    data: { title: 'Add Resource Type' },
  },
  {
    path: 'resource-types/:businessTypeId/:code/edit',
    loadComponent: () =>
      import('./pages/resource-type-form/resource-type-form.component').then(
        (m) => m.ResourceTypeFormComponent,
      ),
    data: { title: 'Edit Resource Type' },
  },
  {
    path: 'resource-types',
    loadComponent: () =>
      import('./pages/resource-type-list/resource-type-list.component').then(
        (m) => m.ResourceTypeListComponent,
      ),
    data: { title: 'Resource Types' },
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    data: { title: 'Dashboard' },
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('../settings/settings.routes').then((m) => m.settingsRoutes),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
