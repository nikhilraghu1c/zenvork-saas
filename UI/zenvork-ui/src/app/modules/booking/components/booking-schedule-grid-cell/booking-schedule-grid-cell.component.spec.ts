import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingScheduleGridCellComponent } from './booking-schedule-grid-cell.component';

describe('BookingScheduleGridCellComponent', () => {
  let component: BookingScheduleGridCellComponent;
  let fixture: ComponentFixture<BookingScheduleGridCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingScheduleGridCellComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(BookingScheduleGridCellComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
