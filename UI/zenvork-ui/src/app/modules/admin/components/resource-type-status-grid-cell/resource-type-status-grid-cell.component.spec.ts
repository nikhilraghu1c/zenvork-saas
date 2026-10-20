import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceTypeStatusGridCellComponent } from './resource-type-status-grid-cell.component';

describe('ResourceTypeStatusGridCellComponent', () => {
  let component: ResourceTypeStatusGridCellComponent;
  let fixture: ComponentFixture<ResourceTypeStatusGridCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ResourceTypeStatusGridCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(ResourceTypeStatusGridCellComponent);
    component = fixture.componentInstance;
  });

  it('shows the inactive lifecycle state', () => {
    component.agInit({ data: { isActive: false } } as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Inactive');
  });
});
