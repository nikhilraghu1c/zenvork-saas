import { Routes } from "@angular/router";

export const ANALYTICS_ROUTES: Routes = [
  {
    path: "",
    title: "Analytics | Zenvork",
    loadComponent: () =>
      import("./pages/revenue-analytics/revenue-analytics.component").then(
        (component) => component.RevenueAnalyticsComponent,
      ),
  },
];
