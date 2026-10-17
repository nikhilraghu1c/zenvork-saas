// Owners always retain workspace access; staff need an explicit reminder-access grant.
const canSendReminders = (user) => user.role === "OWNER" || user.canSendReminders === true;

export { canSendReminders };
