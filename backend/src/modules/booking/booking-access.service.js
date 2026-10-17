import Resource from "../resource/resource.model.js";
import Business from "../business/business.model.js";
import BusinessType from "../business/business-type.model.js";
import { tenantFilter, tenantId } from "../../utils/tenant-scope.js";

const BOOKING_ACCESS_SCOPES = ["NONE", "OWN_AND_UNASSIGNED", "ALL"];

// Owners always retain tenant-wide booking control; staff fall back to no access until explicitly granted.
const bookingAccessScope = (user) => {
  if (user.role === "OWNER") return "ALL";
  // Missing permissions are denied; only an owner can explicitly grant booking access.
  return user.bookingAccessScope ?? "NONE";
};

// Person-resource types come from the business configuration, not from an empty assignment array.
const getPersonResourceTypeCodes = async (req) => {
  const business = await Business.findById(tenantId(req)).select("businessTypeId").lean();
  if (!business) return [];

  const businessType = await BusinessType.findById(business.businessTypeId)
    .select("resourceTypes")
    .lean();
  return (businessType?.resourceTypes ?? [])
    .filter((resourceType) => resourceType.isPerson === true)
    .map((resourceType) => resourceType.code);
};

// Resolve assigned resources with their type and linked account before applying practitioner rules.
const getResources = async (req, resourceIds) => {
  if (!resourceIds?.length) return [];
  return Resource.find(tenantFilter(req, { _id: { $in: resourceIds } }))
    .select("resourceType linkedUserId")
    .lean();
};

// Creating a booking is a mutation, so staff without booking access cannot create one.
const canCreateBookings = (req) => bookingAccessScope(req.user) !== "NONE";

// Protect individual reads and lifecycle updates after the tenant-owned booking has been loaded.
const canManageBooking = async (req, booking) => {
  const scope = bookingAccessScope(req.user);
  if (scope === "ALL") return true;
  if (scope === "NONE") return false;
  const personTypes = new Set(await getPersonResourceTypeCodes(req));
  const resources = await getResources(req, booking.resourceIds);
  const assignedPeople = resources.filter((resource) => personTypes.has(resource.resourceType));
  // A chair-only or room-only booking is unassigned; an unlinked person resource is not.
  return (
    assignedPeople.length === 0 ||
    assignedPeople.some((resource) => resource.linkedUserId?.equals(req.user._id))
  );
};

// Keep restricted staff from assigning another login user's person resource during create, edit, or check-in.
const canAssignResources = async (req, resourceIds) => {
  if (bookingAccessScope(req.user) === "ALL") return true;
  if (bookingAccessScope(req.user) === "NONE") return false;
  const [personTypeCodes, resources] = await Promise.all([
    getPersonResourceTypeCodes(req),
    getResources(req, resourceIds),
  ]);
  const personTypes = new Set(personTypeCodes);
  // Restricted staff may reserve shared equipment/rooms, but a person resource must be their own.
  return (
    resources.length === resourceIds.length &&
    resources.every(
      (resource) =>
        !personTypes.has(resource.resourceType) || resource.linkedUserId?.equals(req.user._id),
    )
  );
};

// A practitioner must claim an unassigned booking with their own person resource when checking in.
const hasOwnPersonResource = async (req, resourceIds) => {
  const [personTypeCodes, resources] = await Promise.all([
    getPersonResourceTypeCodes(req),
    getResources(req, resourceIds),
  ]);
  const personTypes = new Set(personTypeCodes);
  return resources.some(
    (resource) =>
      personTypes.has(resource.resourceType) && resource.linkedUserId?.equals(req.user._id),
  );
};

// Compute display-safe action capabilities once per list response; controllers remain the final authority.
const getBookingCapabilities = async (req, bookings) => {
  const scope = bookingAccessScope(req.user);
  if (scope === "ALL") {
    return bookings.map(() => ({ canManage: true }));
  }
  if (scope === "NONE") {
    return bookings.map(() => ({ canManage: false }));
  }

  const [personTypeCodes, ownResources] = await Promise.all([
    getPersonResourceTypeCodes(req),
    Resource.find(tenantFilter(req, { linkedUserId: req.user._id })).select("_id").lean(),
  ]);
  const personTypes = new Set(personTypeCodes);
  const ownResourceIds = new Set(ownResources.map((resource) => resource._id.toString()));

  return bookings.map((booking) => {
    const source = typeof booking.toObject === "function" ? booking.toObject() : booking;
    const assignedPeople = (source.resourceIds ?? []).filter((resource) =>
      personTypes.has(resource.resourceType),
    );
    const canManage =
      assignedPeople.length === 0 ||
      assignedPeople.some((resource) => ownResourceIds.has((resource._id ?? resource).toString()));

    return { canManage };
  });
};

export {
  BOOKING_ACCESS_SCOPES,
  bookingAccessScope,
  canCreateBookings,
  canManageBooking,
  canAssignResources,
  hasOwnPersonResource,
  getBookingCapabilities,
};
