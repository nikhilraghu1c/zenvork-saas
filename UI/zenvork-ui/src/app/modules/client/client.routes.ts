import { Routes } from '@angular/router';
import { ownerGuard } from '../../core/guards/owner-guard';

export const clientRoutes: Routes = [
  {
    path: '',
    canActivate: [ownerGuard],
    data: { title: 'Clients' },
    loadComponent: () =>
      import('./pages/client-list/client-list.component').then((m) => m.ClientListComponent),
  },
];
