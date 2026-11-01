import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResourceGridActionsComponent } from './resource-grid-actions.component';
import { provideFeatureTranslations } from '../../../../core/i18n/provide-feature-translations';
import { resourcesTranslations } from '../../i18n/resources.translations';

describe('ResourceGridActionsComponent', () => {
  let component: ResourceGridActionsComponent;
  let fixture: ComponentFixture<ResourceGridActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceGridActionsComponent],
      providers: [provideFeatureTranslations(resourcesTranslations), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceGridActionsComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
