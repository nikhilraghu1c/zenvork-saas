# Reminders API

All Reminder endpoints require the authenticated user's HttpOnly cookie. The server derives
`businessId` from that user; callers cannot read or update another business's reminder.

Zenvork creates one manual appointment reminder for each scheduled booking. It becomes actionable
24 hours before the scheduled start, or immediately when an appointment is scheduled less than 24
hours ahead. The API does not send WhatsApp or SMS: staff open WhatsApp/copy the generated message in
the UI, then explicitly record the outcome.

## List a reminder tab

```http
GET /api/reminders?tab=to-send&page=1&limit=25
```

Tabs are `to-send` (pending reminders whose due time has arrived), `upcoming` (pending reminders
whose due time is still in the future), and `sent-today` (reminders staff confirmed as sent during the
current business day). The UI intentionally offers no early-send action for Upcoming. `page` defaults
to `1`; `limit` defaults to `25` and cannot exceed `100`.

Before returning a list, the backend changes pending reminders whose appointment start passed to
`EXPIRED`. The response contains one list for the selected tab, counts for `toSend`, `upcoming`, and
`sentToday`, and pagination. Marking a reminder sent moves it from To send to Sent today. Sent today
is a daily confirmation log, so it can show a sent reminder even after that appointment has started.

Each reminder exposes only client name/mobile, its own planned-start snapshot, service names, and
resource summaries. The snapshot means a sent reminder keeps the appointment time that was
communicated even when the booking is later rescheduled. It is returned as
`booking.scheduledStartAt` to preserve the response shape. It never exposes `businessId` or
`resolvedBy`.

## Record a manual outcome

```http
PATCH /api/reminders/:id
```

```json
{ "action": "sent" }
```

Allowed actions are `sent` and `skipped`. The server changes a due, active reminder to `SENT` or
`SKIPPED`, records server time and authenticated staff member, and retains it as history. The UI opens
WhatsApp first, then asks staff to explicitly confirm before it sends the `sent` action; it does not
infer delivery from WhatsApp. It does not alter the booking's schedule, status, or `updatedAt`. A
handled or expired reminder returns `409`.

## Lifecycle and retention

```text
Upcoming → To send → Expired
                 ↘ Mark sent → Sent today
                 ↘ Skip      → terminal history
```

Rescheduling cancels the prior pending reminder and creates one for the new slot. Check-in,
completion, cancellation, and no-show cancel any pending reminder. At check-in, the queue end is the
earlier of the planned start and server-recorded `actualStartAt`: early check-in removes pending work
without changing `SENT` history. A reminder sent on that business day remains visible in Sent today.
`SENT`,
`SKIPPED`, `CANCELLED`, and `EXPIRED` entries receive `purgeAt` 45 days ahead. MongoDB's TTL index
deletes them after that date; deletion is asynchronous and does not run at an exact second.
