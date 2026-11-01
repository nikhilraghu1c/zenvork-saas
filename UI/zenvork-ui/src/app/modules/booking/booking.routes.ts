import { Routes } from '@angular/router';
import { provideFeatureTranslations } from '../../core/i18n/provide-feature-translations';
import { bookingTranslations } from './i18n/booking.translations';

export const bookingRoutes: Routes = [
  {
    path: '',
    providers: [provideFeatureTranslations(bookingTranslations)],
    children: [
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
    ],
  },
];
