import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { coreTranslations } from '../i18n/core.translations';
import { AppLanguage, TranslationCatalog } from '../i18n/translation-catalog';

const LANGUAGE_STORAGE_KEY = 'zenvork-language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: { ...coreTranslations.en },
    hi: { ...coreTranslations.hi },
  };
  readonly language = signal<AppLanguage>(this.readStoredLanguage());

  constructor() {
    this.applyDocumentLanguage(this.language());
  }

  /** Changes only static interface copy; tenant-entered business data remains unchanged. */
  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    this.applyDocumentLanguage(language);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // A blocked storage setting must not prevent an in-memory language change.
    }
  }

  /** Merges a route-level catalogue after its lazy feature injector becomes active. */
  registerTranslations(catalog: TranslationCatalog): void {
    Object.assign(this.translations.en, catalog.en);
    Object.assign(this.translations.hi, catalog.hi);
  }

  /** Returns a static label, keeping English as a fallback while a feature is still loading. */
  translate(key: string): string {
    return this.translations[this.language()][key] ?? this.translations.en[key] ?? key;
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    this.document.documentElement.lang = language;
  }

  private readStoredLanguage(): AppLanguage {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'hi' ? 'hi' : 'en';
    } catch {
      return 'en';
    }
  }
}
