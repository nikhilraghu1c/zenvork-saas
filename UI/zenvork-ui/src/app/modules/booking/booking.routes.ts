import { Routes } from '@angular/router';

export const bookingRoutes: Routes = [
  {
    path: 'new',
    data: { title: 'New Booking' },
    loadComponent: () =>
      import('./pages/booking-form/booking-form.component').then((m) => m.BookingFormComponent),
  },
  {
    path: 'calendar',
    data: { title: 'Booking calendar' },
    loadComponent: () =>
      import('./pages/booking-calendar/booking-calendar.component').then(
        (m) => m.BookingCalendarComponent,
      ),
  },
  {
    path: ':id/edit',
    data: { title: 'Edit Booking' },
    loadComponent: () =>
      import('./pages/booking-edit/booking-edit.component').then((m) => m.BookingEditComponent),
  },
  {
    path: ':id',
    data: { title: 'Booking Details' },
    loadComponent: () =>
      import('./pages/booking-details/booking-details.component').then((m) => m.BookingDetailsComponent),
  },
  {
    path: '',
    data: { title: 'Booking' },
    loadComponent: () =>
      import('./pages/booking-list/booking-list.component').then((m) => m.BookingListComponent),
  },
];
