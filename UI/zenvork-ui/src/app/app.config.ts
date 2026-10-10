import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import DOMPurify from 'dompurify';
import { provideMarkdown, SANITIZE } from 'ngx-markdown';

import { routes } from './app.routes';
import { unauthorizedInterceptor } from './core/interceptors/unauthorized.interceptor';

// Assistant-generated Markdown can use only these presentation tags and safe link attributes.
const sanitizeMarkdown = (html: string): string => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: [
    'a', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'li',
    'ol', 'p', 'pre', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul',
  ],
  ALLOWED_ATTR: ['href', 'title'],
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptors([unauthorizedInterceptor])),
    provideMarkdown({
      sanitize: { provide: SANITIZE, useValue: sanitizeMarkdown },
    }),
    // Material's calendar input follows the same day-first format used throughout Zenvork.
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    provideNativeDateAdapter(),
  ],
};
