import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  /** Resolves static interface text at render time so a language change updates the active view. */
  transform(key: string): string {
    return this.language.translate(key);
  }
}
