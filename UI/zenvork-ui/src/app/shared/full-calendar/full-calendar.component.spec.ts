import { ComponentFixture, TestBed } from '@angular/core/testing';
import dayGridPlugin from '@fullcalendar/daygrid';
import { AppFullCalendarComponent } from './full-calendar.component';

describe('AppFullCalendarComponent', () => {
  let component: AppFullCalendarComponent;
  let fixture: ComponentFixture<AppFullCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppFullCalendarComponent] }).compileComponents();
    fixture = TestBed.createComponent(AppFullCalendarComponent);
    fixture.componentRef.setInput('options', { plugins: [dayGridPlugin], initialView: 'dayGridMonth' });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
