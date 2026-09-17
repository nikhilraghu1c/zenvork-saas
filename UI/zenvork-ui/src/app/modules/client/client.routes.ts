import { Routes } from '@angular/router';

export const clientRoutes: Routes = [
  {
    path: '',
    data: { title: 'Clients' },
    loadComponent: () =>
      import('./pages/client-list/client-list.component').then((m) => m.ClientListComponent),
  },
];
