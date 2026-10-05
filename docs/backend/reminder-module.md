# Reminder module

This guide explains `backend/src/modules/reminder`. It is a manual appointment-reminder queue: it
does not run a delivery scheduler or call WhatsApp/SMS providers.

## Routes, validation, and tenant safety

```text
GET   /api/reminders       selected tab and its workspace counts
PATCH /api/reminders/:id   record sent or skipped
```

`routes/index.routes.js` applies `userAuth` before the module router. The controller derives
`businessId` through `tenantId(req)` or `tenantFilter(req, ...)`; a request never supplies a tenant.
Validation allows only `tab`, `page`, and `limit` on queue reads, and only `{ action: 'sent' }` or
`{ action: 'skipped' }` on writes.

## Model and indexes

Each `Reminder` belongs to one business, booking, and client. `dueAt` is when staff should act;
`expiresAt` is the appointment start. The states are `PENDING`, `SENT`, `SKIPPED`, `CANCELLED`, and
`EXPIRED`.

```js
reminderSchema.index({ businessId: 1, status: 1, dueAt: 1 });
reminderSchema.index({ businessId: 1, status: 1, expiresAt: 1 });
reminderSchema.index({ businessId: 1, bookingId: 1, status: 1 });
```

The first supports the time-based queue tabs. The second supports request-time expiry. The third
supports booking cancellation/rescheduling. The partial unique index on `{ businessId, bookingId,
type }` only applies while `status: 'PENDING'`, so one booking has at most one active appointment
reminder while terminal historical entries remain after reschedules.

```js
reminderSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
```

This is a MongoDB TTL index, not merely a faster-search index. A terminal record receives a future
Date in `purgeAt`; MongoDB's TTL monitor removes it after that date. Pending records keep `purgeAt`
as `null`, so they are not deleted. TTL cleanup is approximate rather than exact and needs no cron job.

## Create or replace a pending reminder

**Requirement:** a scheduled booking must have one reminder for its current slot, never one for an
old rescheduled time.

```js
await Reminder.updateMany(
  { businessId, bookingId, status: 'PENDING' },
  { $set: terminalUpdate('CANCELLED', now, resolvedBy) },
);
```

`updateMany()` changes every pending reminder for that booking. Its filter means **this business AND
this booking AND pending state**. Historical sent/skipped records are never rewritten. The helper then
creates a new reminder with `dueAt = max(scheduledStartAt - 24 hours, now)`, so an appointment made
less than a day ahead is due immediately rather than sent early or omitted.

The booking controller calls this helper after a scheduled booking is created, first scheduled, or
rescheduled. New client/booking/reminder creation uses the existing MongoDB transaction.

## Lazy expiry and queue filters

**Requirement:** a reminder must leave active work after its appointment starts, without a scheduler.

```js
await Reminder.updateMany(
  { businessId, status: 'PENDING', expiresAt: { $lte: now } },
  { $set: terminalUpdate('EXPIRED', now) },
);
```

`expiresAt: { $lte: now }` means the appointment start is earlier than or equal to server time. This
request-time update is called lazy expiry. Then the tabs use:

```js
// To send and Upcoming start with:
{ businessId, status: 'PENDING', expiresAt: { $gt: now } }
// To send adds:
{ dueAt: { $lte: now } }
// Upcoming
{ dueAt: { $gt: now } }
// Sent today is a daily history log, not an active queue:
{ businessId, status: 'SENT', resolvedAt: { $gte: startOfToday, $lt: startOfTomorrow } }
```

Sibling fields are combined with **AND**. `Sent today` deliberately does not require `expiresAt > now`:
staff need to see confirmations made today even if that appointment already started. The
reporting-period helper produces business-timezone day bounds, so Reminder and Analytics pages share
Asia/Kolkata calendar rules.

## Manual actions and booking lifecycle

The UI opens WhatsApp or copies text locally, then calls the API only after staff marks a reminder sent
or skipped. The controller accepts only a tenant-owned pending reminder with `dueAt: { $lte: now }` and
`expiresAt: { $gt: now }`; this prevents early sends and a stale browser tab marking an already-started
appointment as sent. Reminder writes never change Booking `updatedAt` or reorder the All bookings
activity feed.

```text
Create scheduled / first schedule / reschedule → replace pending reminder
Early check-in                                 → shorten queue expiry to actual start; cancel pending work
Completed / cancelled / no-show                → cancel pending reminder
```

The booking stays scheduled after a reminder is sent. The sent record moves to the Sent today tab for
that business day. Terminal reminders are retained for 45 days, then the TTL index removes them.
