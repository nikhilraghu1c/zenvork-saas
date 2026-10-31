import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let document: Document;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageService);
    document = TestBed.inject(DOCUMENT);
  });

  it('defaults to English when there is no stored choice', () => {
    expect(service.language()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('persists and applies a Hindi preference', () => {
    service.setLanguage('hi');

    expect(service.language()).toBe('hi');
    expect(localStorage.getItem('zenvork-language')).toBe('hi');
    expect(document.documentElement.lang).toBe('hi');
    expect(service.translate('navigation.bookings')).toBe('बुकिंग्स');
  });

  it('merges a lazy feature catalogue after the feature route loads', () => {
    service.registerTranslations({
      en: { 'client.title': 'Clients' },
      hi: { 'client.title': 'क्लाइंट्स' },
    });
    service.setLanguage('hi');

    expect(service.translate('client.title')).toBe('क्लाइंट्स');
  });
});
