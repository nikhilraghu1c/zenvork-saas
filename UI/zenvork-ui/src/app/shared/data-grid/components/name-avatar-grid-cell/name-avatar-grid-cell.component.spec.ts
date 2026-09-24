import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NameAvatarGridCellComponent } from './name-avatar-grid-cell.component';

describe('NameAvatarGridCellComponent', () => {
  let fixture: ComponentFixture<NameAvatarGridCellComponent>;
  let component: NameAvatarGridCellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NameAvatarGridCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(NameAvatarGridCellComponent);
    component = fixture.componentInstance;
  });

  it('renders a one-letter identifier for the cell value', () => {
    component.agInit({ value: 'Asha Patel', data: { name: 'Asha Patel' } } as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Asha Patel');
    expect(fixture.nativeElement.textContent).toContain('A');
  });
});
