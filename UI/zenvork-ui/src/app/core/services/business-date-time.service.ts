import { Injectable } from '@angular/core';

export type BusinessDateFormat = 'date' | 'compactDate' | 'time' | 'dateTime' | 'monthDay' | 'year';
export type DateTimeValue = Date | number | string | null | undefined;

// This becomes a tenant-configured IANA timezone once business settings are available.
export const BUSINESS_TIME_ZONE = 'Asia/Kolkata';
export const BUSINESS_LOCALE = 'en-IN';

@Injectable({ providedIn: 'root' })
export class BusinessDateTimeService {
  readonly timeZone = BUSINESS_TIME_ZONE;

  /** Formats one stored UTC instant using the current business display timezone. */
  format(value: DateTimeValue, format: BusinessDateFormat = 'date'): string {
    const date = this.parse(value);
    if (!date) return '—';

    if (format === 'compactDate') {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: this.timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    }
    if (format === 'time') {
      return new Intl.DateTimeFormat(BUSINESS_LOCALE, {
        timeZone: this.timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
        .format(date)
        .toUpperCase();
    }
    if (format === 'dateTime') {
      return new Intl.DateTimeFormat(BUSINESS_LOCALE, {
        timeZone: this.timeZone,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
        .format(date)
        .toUpperCase();
    }
    if (format === 'monthDay') {
      return new Intl.DateTimeFormat(BUSINESS_LOCALE, {
        timeZone: this.timeZone,
        day: 'numeric',
        month: 'short',
      }).format(date);
    }
    if (format === 'year') {
      return new Intl.DateTimeFormat(BUSINESS_LOCALE, {
        timeZone: this.timeZone,
        year: 'numeric',
      }).format(date);
    }

    return new Intl.DateTimeFormat(BUSINESS_LOCALE, {
      timeZone: this.timeZone,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  /** Returns today's calendar date in the business timezone for native date inputs. */
  businessDateInputValue(value: Date = new Date()): string {
    const { year, month, day } = this.parts(value);
    return `${year}-${this.pad(month)}-${this.pad(day)}`;
  }

  /** Converts one business-local date/time from native inputs into the API's UTC ISO format. */
  toBusinessDateTimeIso(dateValue: string, timeValue: string): string {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
    if (!dateMatch || !timeMatch) throw new Error('Invalid business date or time');

    const [year, month, day] = dateMatch.slice(1).map(Number);
    const [hour, minute] = timeMatch.slice(1).map(Number);
    const localWallTime = Date.UTC(year, month - 1, day, hour, minute);
    let utcTime = localWallTime;

    // Recalculate the offset because configurable zones may observe daylight saving time.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      utcTime = localWallTime - this.timeZoneOffsetMilliseconds(new Date(utcTime));
    }
    const result = new Date(utcTime);
    const resultParts = this.parts(result);
    if (
      resultParts.year !== year ||
      resultParts.month !== month ||
      resultParts.day !== day ||
      resultParts.hour !== hour ||
      resultParts.minute !== minute
    ) {
      throw new Error('This time does not exist in the business timezone');
    }
    return result.toISOString();
  }

  /** Builds UTC API bounds for one midnight-to-midnight business calendar day. */
  businessDayRange(dateValue: string): { from: string; to: string } {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    if (!dateMatch) throw new Error('Invalid business date');

    const [year, month, day] = dateMatch.slice(1).map(Number);
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDate = `${nextDay.getUTCFullYear()}-${this.pad(nextDay.getUTCMonth() + 1)}-${this.pad(nextDay.getUTCDate())}`;
    return {
      from: this.toBusinessDateTimeIso(dateValue, '00:00'),
      to: this.toBusinessDateTimeIso(nextDate, '00:00'),
    };
  }

  private parse(value: DateTimeValue): Date | null {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private parts(value: Date): Record<'year' | 'month' | 'day' | 'hour' | 'minute', number> {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(value);
    const valueFor = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    return {
      year: valueFor('year'),
      month: valueFor('month'),
      day: valueFor('day'),
      hour: valueFor('hour'),
      minute: valueFor('minute'),
    };
  }

  private timeZoneOffsetMilliseconds(value: Date): number {
    const { year, month, day, hour, minute } = this.parts(value);
    return Date.UTC(year, month - 1, day, hour, minute) - value.getTime();
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
