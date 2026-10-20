import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessTypeGridActionsComponent } from './business-type-grid-actions.component';

describe('BusinessTypeGridActionsComponent', () => {
  let component: BusinessTypeGridActionsComponent;
  let fixture: ComponentFixture<BusinessTypeGridActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BusinessTypeGridActionsComponent] }).compileComponents();
    fixture = TestBed.createComponent(BusinessTypeGridActionsComponent);
    component = fixture.componentInstance;
  });

  it('shows deactivate for an active business type', () => {
    component.agInit({ data: { isActive: true } } as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Deactivate');
  });
});
