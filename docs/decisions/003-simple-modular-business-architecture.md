# ADR 003: Prefer simple modules over forced generalization

- Status: Proposed — provisional direction
- Date: 2026-09-10

This records the current working direction, not a final architecture commitment. The initial
Accepted status was premature. We may revise or replace this proposal as other approaches are
evaluated or implementation reveals better options. Favor simplicity for developers and owners;
the module boundaries and reuse strategy below remain open to change.

## Context

Zenvork is intended to support salons, clinics, gyms, and future business types such as garages.
These businesses share some operations but have different workflows and records. Making every
feature generic would introduce conditional behavior and configuration complexity for developers
and business owners. Separate applications would duplicate the platform foundation.

## Proposed direction

Keep one Angular application and one modular backend. Introduce modules incrementally as features
are implemented; this decision does not imply that the proposed business modules already exist.

- Share code when business rules match and the abstraction makes implementation easier to
  understand. Similar screens or field names alone do not justify shared domain behavior.
- Prefer explicit implementations and modest duplication over abstractions requiring numerous
  options, business-type branches, or indirection. Extract shared behavior when concrete use cases
  establish a stable common contract.
- Use business presets/configuration for terminology, defaults, and enabled features. Avoid
  scattering business-type checks throughout shared code. Do not build a universal workflow
  engine or a configurable framework in anticipation of hypothetical businesses.
- Keep distinct business rules in dedicated modules within the same application. Examples include
  clinical encounters and prescriptions, fitness classes and enrolments, and vehicles and repair
  jobs. Reuse underlying services only where their behavior actually matches.
- Separate time/resource reservations from the work performed. An appointment is not a clinical
  encounter or a repair job; a group session has enrolments rather than unrelated appointments.
- Keep owner-facing flows focused on the enabled business features, with sensible defaults and
  only configuration that owners need to make meaningful decisions.
- Preserve tenant isolation for every business-owned record and operation, including dedicated
  modules. Owners and staff authenticate; clients remain tenant-owned records without login.

Potential shared areas include tenant identity, authentication, client contacts, staff, billing,
and notifications. Their boundaries must follow actual requirements rather than a requirement
to make every business use an identical model or UI. These are candidates for reuse, not a
mandatory list of shared modules. Keep critical rules such as tenant authorization and payment
correctness authoritative so fixes remain consistent.

## Incremental validation

- Start with one complete salon workflow and validate it with users. Choose the next business
  type based on demand; use clinics, gyms, and garages as design scenarios without implementing
  speculative requirements.
- Begin with simple presets and explicit feature checks. Add support for combined business
  capabilities only when a concrete use case establishes how their rules interact.
- Define the supported depth of each business type before implementation. Booking and billing
  do not imply full clinical practice management, gym access management, or repair operations.
- Allow dedicated feature pages when they simplify the owner's workflow; shared UI primitives
  do not require identical screens.
- Revisit boundaries when shared code accumulates exceptions, changes repeatedly affect
  unrelated domains, or access and scaling requirements diverge.

## Scaling approach

Begin with a modular monolith. One product does not require one server or one database forever;
consider separate services or deployments only when measured workloads or operational needs
justify their cost. Module extraction is not assumed to be effortless.

Validate scale through tenant-scoped queries and appropriate indexes, atomic booking/capacity
enforcement, bounded queries, reliable background work, and tenant-aware monitoring and limits.
The architecture alone does not establish a supported tenant count. Additional business types
also increase product, testing, onboarding, and support responsibilities even when runtime
performance is adequate.

## Consequences

Some intentional duplication is acceptable, and shared behavior may be extracted later. Each new
business type can introduce dedicated code without requiring another application or forcing its
workflow into an existing domain model. Developers must assess simplicity for both maintainers
and business owners when choosing between configuration, reuse, and separate implementation.
