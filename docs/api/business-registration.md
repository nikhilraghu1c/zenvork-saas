# Business registration API (retired)

Public business registration is no longer available. Frontend code must not call
`POST /api/register-business`.

A seeded `PLATFORM_ADMIN` creates businesses and owner accounts through
`POST /api/admin/businesses`. The platform admin form fetches active types from
`GET /api/admin/business-types`, submits the selected type ID, and displays the generated temporary owner
password only once. See [Platform administration API](admin.md).
