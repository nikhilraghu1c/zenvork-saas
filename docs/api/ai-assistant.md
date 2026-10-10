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
`mock` provider remains offline; when an administrator explicitly enables Gemini, only the current
user's most recent 20 conversation messages and Zenvork's server-defined behavior instructions are
sent to it. The server may also include up to two matching entries from its curated, implemented-feature
catalog; tenant business records are never sent to a provider in this phase. Questions outside
Zenvork features and defined business-planning or client-communication requests receive a fixed
Zenvork-only response without calling a provider.

### `PATCH /api/assistant/conversations/:id`

Accepts `{ "title": "..." }` to rename a private conversation.

### `DELETE /api/assistant/conversations/:id`

Permanently deletes the conversation and every embedded message.
