import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessStatusGridCellComponent } from './business-status-grid-cell.component';

describe('BusinessStatusGridCellComponent', () => {
  let component: BusinessStatusGridCellComponent;
  let fixture: ComponentFixture<BusinessStatusGridCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BusinessStatusGridCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(BusinessStatusGridCellComponent);
    component = fixture.componentInstance;
  });

  it('shows suspended for a suspended business', () => {
    component.agInit({ data: { status: 'SUSPENDED' } } as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Suspended');
  });
});
