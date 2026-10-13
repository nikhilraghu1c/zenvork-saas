const formatCurrency = (amountPaise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);

const formatReportingDate = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

// Formats trusted aggregate tool output locally so the response model cannot alter revenue figures.
const formatRevenueSummary = (summary) => {
  const dateLabel =
    summary.fromDate === summary.toDate
      ? formatReportingDate(summary.fromDate)
      : `${formatReportingDate(summary.fromDate)} to ${formatReportingDate(summary.toDate)}`;

  return `Revenue summary for ${dateLabel}:
- Billed: ${formatCurrency(summary.billedPaise)} (${summary.billedBookingsCount} completed bookings)
- Collected: ${formatCurrency(summary.collectedPaise)} (${summary.collectedBookingsCount} paid bookings)
- Pending payment: ${formatCurrency(summary.pendingPaymentPaise)} (${summary.pendingPaymentBookingsCount} bookings)`;
};

export { formatRevenueSummary };
