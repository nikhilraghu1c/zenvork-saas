# AI Assistant module learning guide

**Code:** `backend/src/modules/assistant/`.

## Responsibility

The Assistant stores a private, short-lived conversation for one authenticated Zenvork user and turns a
message into either:

- a fixed local safety/scope reply;
- a Gemini or mock provider reply with only private chat context and product-help knowledge; or
- a deterministic result from an allowlisted server-owned business-data tool.

The provider never receives raw tenant booking, client, payment, or staff records. A model can classify
intent and extract constrained date input, but it cannot select a tenant, run a database query, or
change a tool's factual output.

## Routes, validation, and conversation lifecycle

`assistant.routes.js` exposes authenticated conversation endpoints. Authentication is applied by the
parent API router; every controller lookup derives `businessId` and `userId` from `req.user`.

```text
GET    /api/assistant/conversations
POST   /api/assistant/conversations
GET    /api/assistant/conversations/:id
PATCH  /api/assistant/conversations/:id
DELETE /api/assistant/conversations/:id
POST   /api/assistant/conversations/:id/messages
```

`assistant.validation.js` accepts only an object containing `content` for a message or `title` for a
conversation rename. Messages are trimmed and limited to 4,000 characters; titles are trimmed and
limited to 100 characters.

`assistant.model.js` embeds messages inside the conversation document. Its compound
`{ businessId, userId, lastMessageAt }` index supports a private newest-first history, while the TTL
index on `purgeAt` deletes an inactive conversation and all embedded messages after seven days.

When `POST .../messages` succeeds, the controller saves the user message and generated reply together,
updates `lastMessageAt`, and extends `purgeAt`. If a provider request fails, neither message is saved;
the frontend restores the unsent text for retry.

## Reply flow

```text
authenticated message
  → tenant- and user-owned conversation lookup
  → local safety checks
  → schema-constrained request classification
  → fixed reply, controlled tool, or provider generation
  → persist user + assistant messages only after success
```

`assistant.service.js` is the orchestration boundary. It selects `mock` or `gemini` from
`AI_PROVIDER`, reads at most the recent 20 private messages, and passes server-derived `businessId` and
`userRole` only to internal tools.

The Gemini adapter uses `AI_MODEL` for normal reply generation and `AI_CLASSIFIER_MODEL` for lower-cost
classification and structured extraction. `AI_CLASSIFIER_MODEL` falls back to `AI_MODEL` in
`config/environment.js`. `GEMINI_API_KEY` remains server-only.

## Classification and safety

`classification/assistant-request-classifier.service.js` applies local pattern checks before any model
request for secrets, professional medical/legal/financial advice, urgent health situations, and prompt
bypass attempts. It then validates the provider's enum and confidence. Invalid, low-confidence, or
unsupported tool combinations fail closed to an out-of-scope reply.

Valid classifications are:

```text
PRODUCT_HELP | BUSINESS_GUIDANCE | CONVERSATION_REFERENCE | DATA_QUERY
UNSAFE_OR_RESTRICTED | OUT_OF_SCOPE
```

Product help receives matching entries from `knowledge/zenvork-feature-catalog.js`.
Conversation-reference requests receive only retained messages from the current private conversation;
they do not refresh live business facts.

## Controlled business-data tools

`tools/assistant-tool-route.js` is the allowlist between classification and database access:

| Tool route | Access | Data returned |
| --- | --- | --- |
| `GET_REVENUE_SUMMARY` | Owner | Aggregate billed, collected, and pending-payment amounts |
| `GET_APPOINTMENT_AGENDA` | Owner or staff | One scheduled day, up to 20 safe appointment rows |
| `GET_REMAINING_APPOINTMENTS` | Owner or staff | Current-day count of pending/scheduled appointments |
| `GET_DAILY_APPOINTMENT_STATUS_SUMMARY` | Owner or staff | Current-day status counts |
| `UNSUPPORTED_DATA_QUERY` | None | Fixed unavailable reply |

Every tool receives server-derived tenant and role values. Formatters build the final answer locally, so
the response model cannot modify amounts, counts, appointment names, or statuses.

### Appointment agenda query

`appointment-agenda.tool.js` queries bookings with:

```js
{
  businessId,
  scheduledStartAt: { $lt: businessDayRange.to },
  scheduledEndAt: { $gt: businessDayRange.from },
}
```

The range represents one `Asia/Kolkata` business calendar day. The two strict bounds select every
schedule interval that overlaps that day, so an appointment running from late today into tomorrow
appears in both one-day agendas. The query sorts by appointment start time, loads at most 21 records to
detect truncation, and returns only the first 20. Its local formatter compares each interval with the
requested date: same-day work shows a compact time range, while crossing work says whether it continues
from a prior day or until a later day. It exposes client name, service names, status, and resource
names—not contact data, notes, payments, or internal IDs.

`assistant-appointment-agenda-query-instruction.js` asks the provider only for a constrained date
intent: `ONE_DAY`, `DATE_RANGE`, or `UNCLEAR`. Date ranges currently return a local one-day-only message
instead of querying an unbounded result set.

### Revenue query

`revenue-summary.tool.js` delegates to the shared analytics reporting service after validating a
past-date range. The revenue tool is owner-only because it exposes financial data. The provider extracts
only `{ fromDate, toDate }`; it does not calculate or phrase the revenue result.

### Current-day appointment counts

`today-appointment-summary.tool.js` uses a tenant-scoped MongoDB aggregation over bookings whose
scheduled interval overlaps today's business-day range. It counts each booking's *current* status, and
`remainingCount` still requires `PENDING` or `SCHEDULED` plus a future `scheduledStartAt`.

### How the current count query works

**Requirement:** give an owner or staff member a small operational count without loading appointment
documents, client data, or resources into Node.js.

```js
Booking.aggregate([
  { $match: {
    businessId,
    scheduledStartAt: { $lt: businessDayRange.to },
    scheduledEndAt: { $gt: businessDayRange.from },
  } },
  { $group: {
    _id: null,
    scheduledCount: { $sum: { $cond: [{ $eq: ['$status', 'SCHEDULED'] }, 1, 0] } },
    completedCount: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
    // The real query also counts PENDING, CHECKED_IN, CANCELLED, and NO_SHOW.
  } },
]);
```

The stages run in this order:

1. `$match.businessId` is the server-derived tenant ID. It prevents one business's Assistant from
   counting another business's bookings.
2. `$match.scheduledStartAt` and `$match.scheduledEndAt` together select schedule intervals that overlap
   one `Asia/Kolkata` calendar day. Strict boundaries prevent a booking ending exactly at midnight from
   appearing on the following day.
3. `$group._id: null` puts every matched booking into one summary bucket instead of one bucket per
   status.
4. Each `$sum` / `$cond` adds `1` only when that booking's current `status` matches; otherwise it adds
   `0`. For example, a `COMPLETED` booking increments `completedCount` exactly once.
5. `remainingCount` additionally checks that status is `PENDING` or `SCHEDULED` and that
   `scheduledStartAt` is later than the current instant. It is therefore a future-slot count, not a
   general count of every booking still awaiting a lifecycle update.

For example, if today's matched bookings have statuses `SCHEDULED`, `SCHEDULED`, `CHECKED_IN`, and
`COMPLETED`, the query returns `scheduledCount: 2`, `checkedInCount: 1`, and `completedCount: 1`.
Whether both scheduled bookings contribute to `remainingCount` also depends on their start times.

This means the current status summary answers “what is the status of appointments scheduled today?” It
does not yet answer lifecycle-event questions such as “what was completed today?” for an appointment
scheduled yesterday; that future query must use `actualEndAt`. Cancellation and no-show event questions
similarly require the relevant `statusHistory.changedAt` entry.

## Error handling

Provider configuration or request failures become a `503` from `assistant.controller.js` with a safe
user message. Tool authorization errors return a local access message. Tool validation errors return a
local date clarification. Unknown errors are logged server-side and return the generic `500` response.

## Reading order

```text
assistant.routes.js
→ assistant.controller.js
→ assistant.validation.js and assistant.model.js
→ assistant.service.js
→ classification / instructions / provider
→ tools / formatter
```

For a live-data question, continue with the selected tool and its underlying booking or analytics
module. This preserves the rule that business facts are fetched by trusted backend code, not by a model.
