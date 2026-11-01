import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { StaffFormComponent } from './staff-form.component';
import { provideFeatureTranslations } from '../../../../core/i18n/provide-feature-translations';
import { staffTranslations } from '../../i18n/staff.translations';

describe('StaffFormComponent', () => {
  let component: StaffFormComponent;
  let fixture: ComponentFixture<StaffFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffFormComponent],
      providers: [provideFeatureTranslations(staffTranslations), provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
