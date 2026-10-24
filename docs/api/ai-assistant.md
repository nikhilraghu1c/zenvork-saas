# AI Assistant API

All assistant endpoints require the authenticated Zenvork cookie. Conversation ownership is derived
from that user and their `businessId`; callers cannot supply either identifier.

## Privacy and retention

Conversations are private to one authenticated owner or staff user within one business. They are not
shared with other users in the tenant. Messages are embedded in their conversation document so that
MongoDB's TTL index deletes the complete conversation, including its messages, after seven days with
no new message activity. The TTL monitor runs asynchronously, so expiry can occur shortly after the
stored timestamp rather than at an exact second.

## Endpoints

### `GET /api/assistant/conversations`

Lists the current user's conversation summaries, newest activity first.

### `POST /api/assistant/conversations`

Creates an empty private conversation.

### `GET /api/assistant/conversations/:id`

Returns one tenant- and user-owned conversation with its messages. Unknown, foreign-tenant, or
another user's IDs return `404`.

### `POST /api/assistant/conversations/:id/messages`

Accepts `{ "content": "..." }`, generates a reply, then persists the user and assistant messages.
The server extends the seven-day retention timestamp only when messages are persisted. The default
`mock` provider remains offline; when an administrator explicitly enables Gemini, the latest user
message is first sent for classification. If a reply is permitted, only the current user's most recent
20 conversation messages and Zenvork's server-defined behavior instructions are sent for generation.
The server may also include up to two matching entries from its curated, implemented-feature catalog;
tenant business records are never sent to a provider in this phase.
After local restricted-request checks, the configured provider classifies the latest message with a
schema-constrained response. Zenvork features are `PRODUCT_HELP` and receive matching catalog context.
Defined business-planning or client-communication requests are `BUSINESS_GUIDANCE`. Restricted requests
(for example, secrets, professional medical/legal/financial advice, or attempts to bypass instructions)
are `UNSAFE_OR_RESTRICTED`; unrelated requests are `OUT_OF_SCOPE`. The last two classifications receive
a fixed server response without a response-generation provider request.
`CONVERSATION_REFERENCE` uses only the private recent conversation context already selected for the
current conversation; it does not query business records or refresh previously stated figures.
Every provider classification also contains one allowlisted tool route. `DATA_QUERY` with
`GET_REVENUE_SUMMARY` triggers a separate schema-constrained date extraction request; the server
validates it and calls its internal owner-only revenue tool. The tool returns only aggregate billed,
collected, and pending-payment facts, which are formatted locally rather than being sent to a response
model. `GET_APPOINTMENT_AGENDA` extracts one business-calendar day, then lets an owner or staff member
view up to 20 tenant appointments occupying that day. The locally formatted agenda contains only
appointment time, client name, service names, status, and resource names; an appointment that crosses
the selected day's boundary explicitly indicates that it continues from or into another date.
Appointment date ranges are not supported yet. `GET_REMAINING_APPOINTMENTS` lets an owner or staff member retrieve a current-day
count of pending or scheduled appointments whose scheduled start time has not passed; checked-in work is
separate from that remaining count. `GET_DAILY_APPOINTMENT_STATUS_SUMMARY` returns a current-day
tenant-scoped count of upcoming, in-progress, completed, cancelled, and no-show appointments. Other
live-data requests receive `UNSUPPORTED_DATA_QUERY` and a fixed unavailable reply until a corresponding
server-owned tool is implemented.

### `PATCH /api/assistant/conversations/:id`

Accepts `{ "title": "..." }` to rename a private conversation.

### `DELETE /api/assistant/conversations/:id`

Permanently deletes the conversation and every embedded message.
