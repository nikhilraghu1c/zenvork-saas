import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BookingFormComponent } from './booking-form.component';

describe('BookingFormComponent', () => {
  let component: BookingFormComponent;
  let fixture: ComponentFixture<BookingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingFormComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BookingFormComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => expect(component).toBeTruthy());
});
