import { Routes } from "@angular/router";
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { analyticsTranslations } from './i18n/analytics.translations';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: "",
    providers: [provideFeatureTranslations(analyticsTranslations)],
    title: "Analytics | Zenvork",
    loadComponent: () =>
      import("./pages/revenue-analytics/revenue-analytics.component").then(
        (component) => component.RevenueAnalyticsComponent,
      ),
  },
];
