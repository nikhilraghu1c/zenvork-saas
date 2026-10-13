const REPORTING_PERIODS = ["today", "week", "month"];
const BUSINESS_TIME_ZONE = "Asia/Kolkata";
const REPORTING_MONTH_HISTORY = 36;
const REPORTING_DATE_RANGE_MAX_DAYS = 366;

// Extracts a calendar date in the current business timezone rather than the server timezone.
const getBusinessDateParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
};

// Converts a current India calendar day into the corresponding UTC instant for MongoDB range queries.
const startOfBusinessDay = (date) => {
  const { year, month, day } = getBusinessDateParts(date);
  return new Date(Date.UTC(year, month - 1, day, -5, -30));
};

// Reuses the business timezone when operational queues need today's calendar bounds.
const getBusinessDayRange = (date = new Date()) => {
  const from = startOfBusinessDay(date);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 1);
  return { from, to };
};

// Builds a reporting window and a previous equal-length window for safe tenant analytics comparisons.
const getReportingRange = (period) => {
  const now = new Date();
  const { year, month, day } = getBusinessDateParts(now);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  let from = startOfBusinessDay(calendarDate);
  let to = new Date(from);

  if (period === "today") to.setUTCDate(to.getUTCDate() + 1);
  if (period === "week") {
    const businessDay = (calendarDate.getUTCDay() + 6) % 7;
    calendarDate.setUTCDate(calendarDate.getUTCDate() - businessDay);
    from = startOfBusinessDay(calendarDate);
    to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 7);
  }
  if (period === "month") {
    calendarDate.setUTCDate(1);
    from = startOfBusinessDay(calendarDate);
    calendarDate.setUTCMonth(calendarDate.getUTCMonth() + 1);
    to = startOfBusinessDay(calendarDate);
  }

  const previousFrom = new Date(from);
  previousFrom.setTime(from.getTime() - (to.getTime() - from.getTime()));
  return { from, to, previousFrom, previousTo: new Date(from) };
};

// Converts a YYYY-MM-DD value into a valid business-calendar date without relying on server-local parsing.
const parseBusinessCalendarDate = (value) => {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

// Validates an inclusive business-date range before converting its end into MongoDB's exclusive boundary.
const getReportingDateRange = ({ fromDate, toDate }) => {
  const fromCalendarDate = parseBusinessCalendarDate(fromDate);
  const toCalendarDate = parseBusinessCalendarDate(toDate);
  if (!fromCalendarDate || !toCalendarDate || toCalendarDate < fromCalendarDate) return null;

  const current = getBusinessDateParts(new Date());
  const today = new Date(Date.UTC(current.year, current.month - 1, current.day));
  if (toCalendarDate > today) return null;

  const earliestSupportedDate = new Date(
    Date.UTC(current.year, current.month - REPORTING_MONTH_HISTORY, 1),
  );
  if (fromCalendarDate < earliestSupportedDate) return null;

  const inclusiveDays =
    Math.floor((toCalendarDate.getTime() - fromCalendarDate.getTime()) / 86_400_000) + 1;
  if (inclusiveDays > REPORTING_DATE_RANGE_MAX_DAYS) return null;

  const from = startOfBusinessDay(fromCalendarDate);
  const endCalendarDate = new Date(toCalendarDate);
  endCalendarDate.setUTCDate(endCalendarDate.getUTCDate() + 1);
  const to = startOfBusinessDay(endCalendarDate);
  const previousFrom = new Date(from);
  previousFrom.setTime(from.getTime() - (to.getTime() - from.getTime()));
  return { from, to, previousFrom, previousTo: new Date(from) };
};

// Validates a whole calendar month and returns business-timezone bounds plus the previous calendar month.
const getReportingMonthRange = (monthValue) => {
  if (typeof monthValue !== "string") return null;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthValue);
  if (!match) return null;

  const [year, month] = match.slice(1).map(Number);
  const selectedMonth = new Date(Date.UTC(year, month - 1, 1));
  if (
    selectedMonth.getUTCFullYear() !== year ||
    selectedMonth.getUTCMonth() !== month - 1
  ) {
    return null;
  }

  const now = new Date();
  const current = getBusinessDateParts(now);
  const currentMonth = new Date(Date.UTC(current.year, current.month - 1, 1));
  const monthsBehind =
    (currentMonth.getUTCFullYear() - year) * 12 +
    currentMonth.getUTCMonth() -
    (month - 1);
  if (monthsBehind < 0 || monthsBehind >= REPORTING_MONTH_HISTORY) return null;

  const from = startOfBusinessDay(selectedMonth);
  const nextMonth = new Date(Date.UTC(year, month, 1));
  const to = startOfBusinessDay(nextMonth);
  const previousMonth = new Date(Date.UTC(year, month - 2, 1));
  const previousFrom = startOfBusinessDay(previousMonth);
  return { from, to, previousFrom, previousTo: from };
};

export {
  BUSINESS_TIME_ZONE,
  REPORTING_DATE_RANGE_MAX_DAYS,
  REPORTING_MONTH_HISTORY,
  REPORTING_PERIODS,
  getBusinessDayRange,
  getBusinessDateParts,
  getReportingDateRange,
  getReportingMonthRange,
  getReportingRange,
};
