import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ResourceService } from '../../../resources/services/resource.service';
import { BookingService } from '../../services/booking.service';
import { BookingListComponent } from './booking-list.component';

describe('BookingListComponent', () => {
  let component: BookingListComponent;
  let fixture: ComponentFixture<BookingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingListComponent],
      providers: [
        {
          provide: BookingService,
          useValue: {
            getBookings: () => of({ bookings: [], pagination: { page: 1, limit: 50, total: 0 } }),
          },
        },
        { provide: ResourceService, useValue: { getResources: () => of({ resources: [] }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
