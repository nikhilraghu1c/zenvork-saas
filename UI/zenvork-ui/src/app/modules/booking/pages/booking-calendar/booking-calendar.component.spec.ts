import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ResourceService } from '../../../resources/services/resource.service';
import { BookingService } from '../../services/booking.service';
import { BookingCalendarComponent } from './booking-calendar.component';

describe('BookingCalendarComponent', () => {
  let component: BookingCalendarComponent;
  let fixture: ComponentFixture<BookingCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCalendarComponent],
      providers: [
        {
          provide: BookingService,
          useValue: {
            getBookings: () => of({ bookings: [], pagination: { page: 1, limit: 100, total: 0 } }),
          },
        },
        { provide: ResourceService, useValue: { getResources: () => of({ resources: [] }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: new Map() } },
        },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
