import { Routes } from '@angular/router';

export const assistantRoutes: Routes = [
  {
    path: '',
    data: { title: 'AI Assistant' },
    loadComponent: () =>
      import('./pages/assistant-workspace/assistant-workspace.component').then(
        (component) => component.AssistantWorkspaceComponent,
      ),
  },
];
