import { BusinessDateTimeService } from './business-date-time.service';

describe('BusinessDateTimeService', () => {
  const service = new BusinessDateTimeService();

  it('converts a business-local India appointment time into an ISO UTC instant', () => {
    expect(service.toBusinessDateTimeIso('2026-09-22', '10:00')).toBe('2026-09-22T04:30:00.000Z');
  });

  it('uses the configured business timezone for one calendar-day query range', () => {
    expect(service.businessDayRange('2026-09-22')).toEqual({
      from: '2026-09-21T18:30:00.000Z',
      to: '2026-09-22T18:30:00.000Z',
    });
  });

  it('returns the same business calendar day regardless of the browser-local timezone', () => {
    expect(service.businessDateInputValue(new Date('2026-09-21T18:30:00.000Z'))).toBe('2026-09-22');
  });
});
