import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingClientGridCellComponent } from './booking-client-grid-cell.component';

describe('BookingClientGridCellComponent', () => {
  let component: BookingClientGridCellComponent;
  let fixture: ComponentFixture<BookingClientGridCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookingClientGridCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(BookingClientGridCellComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => expect(component).toBeTruthy());
});
