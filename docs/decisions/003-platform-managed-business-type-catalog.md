# ADR 003: Use a platform-managed business type catalog

- Status: Accepted
- Date: 2026-09-10

## Context

Business types and their allowed resource types must be shared by backend validation and the
registration UI. Hardcoded type lists require a frontend and backend deployment whenever Zenvork
adds or retires a supported type.

## Decision

Store business types in MongoDB as platform-managed `BusinessType` records. Each `Business` stores
a required `businessTypeId` reference. The public registration UI fetches active types through a
read-only API and submits the selected ID; the backend independently verifies that it is active.

Each type contains its allowed resource-type definitions. Initial records are created through an
explicit seed script. Zenvork-only administration for changing this catalog is deferred.

## Consequences

Adding a supported type or resource type can be done by changing platform data rather than altering
registration validation or the registration UI. Existing referenced records must be deactivated,
not deleted, when they should no longer be offered. Angular still owns its compiled routes and
components; catalog data does not create arbitrary frontend routes.
