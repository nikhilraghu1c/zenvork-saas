import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StaffStatusGridCellComponent } from './staff-status-grid-cell.component';

describe('StaffStatusGridCellComponent', () => {
  let component: StaffStatusGridCellComponent;
  let fixture: ComponentFixture<StaffStatusGridCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StaffStatusGridCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(StaffStatusGridCellComponent);
    component = fixture.componentInstance;
  });

  it('shows an inactive status for a deactivated staff member', () => {
    component.agInit({ data: { isActive: false } } as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Inactive');
    expect(fixture.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('cancel');
  });
});
