const formatBusinessDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));

// Uses a deterministic response so the model cannot alter a live appointment count.
const formatRemainingAppointmentsToday = ({ date, remainingCount }) => {
  const dateLabel = formatBusinessDate(date);
  if (remainingCount === 0) {
    return `You have no appointments remaining today (${dateLabel}).`;
  }

  return `You have ${remainingCount} ${remainingCount === 1 ? "appointment" : "appointments"} remaining today (${dateLabel}).`;
};

export { formatRemainingAppointmentsToday };
