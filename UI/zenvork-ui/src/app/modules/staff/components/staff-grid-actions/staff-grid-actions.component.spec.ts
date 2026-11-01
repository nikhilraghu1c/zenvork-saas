import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StaffGridActionsComponent } from './staff-grid-actions.component';
import { provideFeatureTranslations } from '../../../../core/i18n/provide-feature-translations';
import { staffTranslations } from '../../i18n/staff.translations';

describe('StaffGridActionsComponent', () => {
  let component: StaffGridActionsComponent;
  let fixture: ComponentFixture<StaffGridActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffGridActionsComponent],
      providers: [provideFeatureTranslations(staffTranslations), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffGridActionsComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
