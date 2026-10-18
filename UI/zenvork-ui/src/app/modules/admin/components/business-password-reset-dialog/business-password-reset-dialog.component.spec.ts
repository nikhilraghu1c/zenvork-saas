import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessPasswordResetDialogComponent } from './business-password-reset-dialog.component';

describe('BusinessPasswordResetDialogComponent', () => {
  let component: BusinessPasswordResetDialogComponent;
  let fixture: ComponentFixture<BusinessPasswordResetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessPasswordResetDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessPasswordResetDialogComponent);
    component = fixture.componentInstance;
    component.businessName = 'Example Business';
    component.ownerName = 'Example Owner';
  });

  it('warns before replacing an owner password', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Reset Example Owner's password?");
  });
});
