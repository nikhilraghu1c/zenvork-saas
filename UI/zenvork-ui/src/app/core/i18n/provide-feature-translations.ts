import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { TranslationCatalog } from './translation-catalog';

/** Registers a feature catalogue only after that feature's lazy route injector is created. */
export const provideFeatureTranslations = (catalog: TranslationCatalog): EnvironmentProviders => {
  return provideEnvironmentInitializer(() => {
    inject(LanguageService).registerTranslations(catalog);
  });
};
