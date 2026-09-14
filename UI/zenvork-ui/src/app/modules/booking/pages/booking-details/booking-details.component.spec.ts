import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BookingDetailsComponent } from './booking-details.component';

describe('BookingDetailsComponent', () => {
  let component: BookingDetailsComponent;
  let fixture: ComponentFixture<BookingDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingDetailsComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BookingDetailsComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => expect(component).toBeTruthy());
});
