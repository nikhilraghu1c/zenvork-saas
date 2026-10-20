import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessTypeStatusGridCellComponent } from './business-type-status-grid-cell.component';

describe('BusinessTypeStatusGridCellComponent', () => {
  let component: BusinessTypeStatusGridCellComponent;
  let fixture: ComponentFixture<BusinessTypeStatusGridCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BusinessTypeStatusGridCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(BusinessTypeStatusGridCellComponent);
    component = fixture.componentInstance;
  });

  it('shows the inactive lifecycle state', () => {
    component.agInit({ data: { isActive: false } } as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Inactive');
  });
});
