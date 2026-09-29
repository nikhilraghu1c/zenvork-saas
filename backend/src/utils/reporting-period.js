const REPORTING_PERIODS = ["today", "week", "month"];
const BUSINESS_TIME_ZONE = "Asia/Kolkata";

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

export {
  BUSINESS_TIME_ZONE,
  REPORTING_PERIODS,
  getBusinessDateParts,
  getReportingRange,
};
