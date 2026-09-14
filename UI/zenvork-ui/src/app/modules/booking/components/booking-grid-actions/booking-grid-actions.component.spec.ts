import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookingGridActionsComponent } from './booking-grid-actions.component';

describe('BookingGridActionsComponent', () => {
  let component: BookingGridActionsComponent;
  let fixture: ComponentFixture<BookingGridActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingGridActionsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BookingGridActionsComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => expect(component).toBeTruthy());
});
