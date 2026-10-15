const formatBusinessDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));

// Formats server-calculated operational counts without allowing the response model to alter them.
const formatDailyAppointmentStatusSummary = (summary) => {
  const dateLabel = formatBusinessDate(summary.date);
  if (summary.totalCount === 0) {
    return `You have no appointments scheduled for ${dateLabel}.`;
  }

  const upcomingCount = summary.pendingCount + summary.scheduledCount;
  return `Appointment overview · ${dateLabel}

---

Upcoming: ${upcomingCount}
In progress: ${summary.checkedInCount}
Completed: ${summary.completedCount}
Cancelled: ${summary.cancelledCount}
No-show: ${summary.noShowCount}`;
};

export { formatDailyAppointmentStatusSummary };
