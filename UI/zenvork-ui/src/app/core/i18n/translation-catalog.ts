export const appLanguages = ['en', 'hi'] as const;

export type AppLanguage = (typeof appLanguages)[number];

/** A feature owns one English/Hindi catalogue and can register it only when its lazy route loads. */
export interface TranslationCatalog {
  en: Record<string, string>;
  hi: Record<string, string>;
}
