import { Component, Input, inject } from '@angular/core';
import { AppLanguage } from '../../core/i18n/translation-catalog';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  /** Compact mode fits navigation; panel mode provides the Settings-page explanation. */
  @Input() appearance: 'compact' | 'panel' = 'compact';
  protected readonly language = inject(LanguageService);

  protected setLanguage(language: AppLanguage): void {
    this.language.setLanguage(language);
  }
}
