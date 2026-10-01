# Resource module learning guide

**Code:** `backend/src/modules/resource/`.

## Responsibility

A resource is anything a booking reserves: a staff person, doctor, chair, room, or piece of equipment.
The resource type is configuration-driven by the business's `BusinessType`, so salon and clinic code do
not need separate hardcoded resource models.

## Important creation checks

Resource creation follows this order:

```text
validate name/type/linked user ID
→ load authenticated business
→ verify business type and active resource type
→ if linked user, verify it belongs to this tenant
→ create with tenantData()
```

`validateResourceCreation()` checks request shape first. Database-backed checks then prove that the
configured type and an optional linked user currently belong to the authenticated tenant.

The `resourceTypes` `$elemMatch` query verifies an active configured type in the same query that loads
the business type. A `linkedUserId` is only allowed for types whose configuration has `isPerson: true`.

## Options endpoint

`GET /api/resources/options` returns active configured types for forms. It derives the business from
the session rather than accepting a browser-provided business ID.

## Important database queries

### List resources and resolve person types

**Requirement:** show this tenant's resources and determine which configured types represent people.

```js
const resources = await Resource.find(tenantFilter(req))
  .select('name resourceType isActive linkedUserId createdAt updatedAt')
  .sort({ resourceType: 1, isActive: -1, name: 1, _id: 1 })
  .lean();

const business = await Business.findById(tenantId(req))
  .select('businessTypeId')
  .lean();
const businessType = await BusinessType.findById(business.businessTypeId)
  .select('resourceTypes')
  .lean();
```

The first query gets tenant resources. The next two queries load the business configuration so the
controller can derive whether each type is a person. `findById(tenantId(req))` is safe here because the
tenant ID comes from authenticated server state, not the browser. The resource sort groups type first,
then active before inactive, then name, then `_id` as a stable last tie-breaker.

### Validate a configured type before creation

**Requirement:** allow only a resource type enabled for this business's active platform business type.

```js
BusinessType.findOne({
  _id: business.businessTypeId,
  isActive: true,
  resourceTypes: { $elemMatch: { code: resourceType, isActive: true } },
});
```

`$elemMatch` requires one nested resource-type item to satisfy both conditions. It prevents an inactive
or made-up resource type from being created. Without `$elemMatch`, separate array elements could satisfy
the code and active conditions independently, which would be incorrect.

### Validate an optional linked user

**Requirement:** link a person resource only to an existing user in the same tenant.

```js
User.exists(tenantFilter(req, { _id: linkedUserId }));
```

`exists()` returns a lightweight yes/no result. Tenant scoping prevents linking a user from another
business even when the browser knows that user's ID.

## Person resources in analytics

`getResources` derives `isPerson` from platform configuration. Dashboard analytics uses that same
meaning to rank top staff while excluding non-person resources such as chairs and rooms.

## Indexes

```js
{ businessId: 1, resourceType: 1 }
{ businessId: 1, isActive: 1, resourceType: 1 }
```

Both begin with `businessId`, which preserves tenant isolation and supports resource list/dashboard
queries.

## Lifecycle and current boundary

```text
Create active resource → assign it to a booking → count it as staff only if its type is a person
```

The model contains `isActive`, which booking assignment respects, but there is no resource edit or
activate/deactivate route yet.
