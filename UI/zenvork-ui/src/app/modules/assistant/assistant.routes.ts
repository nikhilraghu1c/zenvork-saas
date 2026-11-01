import { Routes } from '@angular/router';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { assistantTranslations } from './i18n/assistant.translations';

export const assistantRoutes: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations(assistantTranslations)],
    data: { title: 'AI Assistant' },
    loadComponent: () =>
      import('./pages/assistant-workspace/assistant-workspace.component').then(
        (component) => component.AssistantWorkspaceComponent,
      ),
  },
];
