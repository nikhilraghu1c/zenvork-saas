import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingStatusGridCellComponent } from './booking-status-grid-cell.component';

describe('BookingStatusGridCellComponent', () => {
  let component: BookingStatusGridCellComponent;
  let fixture: ComponentFixture<BookingStatusGridCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookingStatusGridCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(BookingStatusGridCellComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => expect(component).toBeTruthy());
});
