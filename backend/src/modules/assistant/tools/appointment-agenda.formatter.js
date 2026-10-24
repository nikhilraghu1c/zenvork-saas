const formatAgendaDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateValue));

const formatAgendaTime = (dateValue) => {
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateValue));
  return time.replace(/\b(am|pm)\b/gi, (value) => value.toUpperCase());
};

// Produces a stable business-calendar key for comparing an appointment against the requested agenda day.
const getBusinessDateKey = (dateValue) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).formatToParts(new Date(dateValue));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

// Makes an interval crossing the requested day unambiguous instead of showing two misleading times.
const formatAgendaInterval = (appointment, agendaDate) => {
  const startsOnAgendaDate = getBusinessDateKey(appointment.scheduledStartAt) === agendaDate;
  const endsOnAgendaDate = getBusinessDateKey(appointment.scheduledEndAt) === agendaDate;
  const startTime = formatAgendaTime(appointment.scheduledStartAt);
  const endTime = formatAgendaTime(appointment.scheduledEndAt);

  if (startsOnAgendaDate && endsOnAgendaDate) {
    return `${startTime}–${endTime}`;
  }
  if (!startsOnAgendaDate && endsOnAgendaDate) {
    return `Continues from ${formatAgendaDate(appointment.scheduledStartAt)}, ${startTime} → ends ${endTime}`;
  }
  if (startsOnAgendaDate && !endsOnAgendaDate) {
    return `Starts ${startTime} → continues until ${formatAgendaDate(appointment.scheduledEndAt)}, ${endTime}`;
  }
  return `Continues through this day (${formatAgendaDate(appointment.scheduledStartAt)}, ${startTime} → ${formatAgendaDate(appointment.scheduledEndAt)}, ${endTime})`;
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
    const time = formatAgendaInterval(appointment, agenda.date);
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
