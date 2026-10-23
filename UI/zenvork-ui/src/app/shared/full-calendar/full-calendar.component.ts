import { Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarApi, CalendarOptions } from '@fullcalendar/core';

/** Shared FullCalendar host that keeps vendor theme styles scoped to Zenvork calendar instances. */
@Component({
  selector: 'app-full-calendar',
  imports: [FullCalendarModule],
  templateUrl: './full-calendar.component.html',
  styleUrl: './full-calendar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AppFullCalendarComponent {
  @Input({ required: true }) options!: CalendarOptions;

  @ViewChild(FullCalendarComponent)
  private calendar?: FullCalendarComponent;

  getApi(): CalendarApi | undefined {
    return this.calendar?.getApi();
  }
}
