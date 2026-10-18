import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessGridActionsComponent } from './business-grid-actions.component';

describe('BusinessGridActionsComponent', () => {
  let component: BusinessGridActionsComponent;
  let fixture: ComponentFixture<BusinessGridActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BusinessGridActionsComponent] }).compileComponents();
    fixture = TestBed.createComponent(BusinessGridActionsComponent);
    component = fixture.componentInstance;
  });

  it('shows suspend for an active business', () => {
    component.agInit({ data: { _id: 'business-id', status: 'ACTIVE' } } as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Suspend');
  });
});
