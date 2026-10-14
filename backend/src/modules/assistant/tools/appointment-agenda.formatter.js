const formatAgendaDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));

const formatAgendaTime = (dateValue) => {
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateValue));
  return time.replace(/\b(am|pm)\b/gi, (value) => value.toUpperCase());
};

const formatAppointmentStatus = (status) =>
  status
    .toLowerCase()
    .split("_")
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");

const appointmentStatusIndicator = (status) => {
  const indicators = {
    PENDING: "🟡",
    SCHEDULED: "🟢",
    CHECKED_IN: "🔵",
    COMPLETED: "✓",
    CANCELLED: "⚪",
    NO_SHOW: "🔴",
  };
  return indicators[status] ?? "•";
};

// Formats trusted agenda data locally so appointment details remain exact and predictable.
const formatAppointmentAgenda = (agenda) => {
  const dateLabel = formatAgendaDate(agenda.date);
  if (agenda.appointments.length === 0) {
    return `You have no appointments scheduled for ${dateLabel}.`;
  }

  const appointmentCount = agenda.appointments.length;
  const heading = agenda.hasMore
    ? `Appointments · ${dateLabel} · First 20 shown`
    : `Appointments · ${dateLabel} · ${appointmentCount}`;
  const rows = agenda.appointments.map((appointment) => {
    const time = `${formatAgendaTime(appointment.scheduledStartAt)}–${formatAgendaTime(appointment.scheduledEndAt)}`;
    const services = appointment.serviceNames.length > 0
      ? appointment.serviceNames.join(", ")
      : "No service selected";
    const resources = appointment.resources.length > 0
      ? ` · ${appointment.resources.map((resource) => resource.name).join(", ")}`
      : "";
    const status = `${appointmentStatusIndicator(appointment.status)} ${formatAppointmentStatus(appointment.status)}`;
    return `${time} · ${appointment.clientName}\n${services}\n${status}${resources}`;
  });

  return `${heading}\n\n---\n\n${rows.join("\n\n---\n\n")}`;
};

export { formatAppointmentAgenda };
