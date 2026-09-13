/** Returns the authenticated tenant identifier for direct tenant-owned lookups. */
const tenantId = (req) => req.user.businessId;

/** Adds an authenticated tenant constraint after all caller-provided query criteria. */
const tenantFilter = (req, filter = {}) => ({
  ...filter,
  businessId: tenantId(req),
});

/** Adds a server-derived tenant identifier after all caller-provided document data. */
const tenantData = (req, data = {}) => ({
  ...data,
  businessId: tenantId(req),
});

export { tenantData, tenantFilter, tenantId };
