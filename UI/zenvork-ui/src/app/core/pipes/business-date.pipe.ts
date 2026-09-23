import { Pipe, PipeTransform, inject } from '@angular/core';
import {
  BusinessDateFormat,
  BusinessDateTimeService,
  DateTimeValue,
} from '../services/business-date-time.service';

@Pipe({ name: 'businessDate', standalone: true, pure: true })
export class BusinessDatePipe implements PipeTransform {
  private readonly dateTime = inject(BusinessDateTimeService);

  /** Applies the shared business timezone and display format inside page templates. */
  transform(value: DateTimeValue, format: BusinessDateFormat = 'date'): string {
    return this.dateTime.format(value, format);
  }
}
