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

Accepts `{ "content": "..." }`, stores the user message, then stores a controlled Phase 1 response.
The server extends the seven-day retention timestamp only when a message is persisted. Phase 1 does
not send tenant business data to an external AI provider.

### `PATCH /api/assistant/conversations/:id`

Accepts `{ "title": "..." }` to rename a private conversation.

### `DELETE /api/assistant/conversations/:id`

Permanently deletes the conversation and every embedded message.
