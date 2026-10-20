import crypto from "node:crypto";
import mongoose from "mongoose";
import Business from "../business/business.model.js";
import BusinessType from "../business/business-type.model.js";
import User from "../users/user.model.js";
import {
  AdminValidationError,
  validateBusinessCreation,
  validateBusinessStatus,
  validateBusinessTypeCreation,
  validateBusinessTypeStatus,
  validateBusinessTypeUpdate,
  validatePlanExpiry,
  validateResourceTypeCreation,
  validateResourceTypeStatus,
  validateResourceTypeUpdate,
} from "./admin.validation.js";

const temporaryPassword = () => crypto.randomBytes(18).toString("base64url");
const businessProjection =
  "name businessTypeId ownerId status planExpiresAt createdByAdminId createdAt updatedAt";

const isValidResourceTypeRoute = (businessTypeId, code) =>
  mongoose.isObjectIdOrHexString(businessTypeId) &&
  typeof code === "string" &&
  /^[A-Z][A-Z0-9_]*$/.test(code.toUpperCase());

const businessTypeResponse = (businessType) => ({
  id: businessType._id,
  code: businessType.code,
  name: businessType.name,
  iconName: businessType.iconName,
  isActive: businessType.isActive === true,
  resourceTypes: businessType.resourceTypes ?? [],
});

const getSummary = async (_req, res) => {
  try {
    // The dashboard flags only active plan dates that fall within the next 30 calendar days.
    const now = new Date();
    const expiringAt = new Date(now);
    expiringAt.setDate(expiringAt.getDate() + 30);
    const [
      summary,
      activeBusinesses,
      suspendedBusinesses,
      expiringBusinesses,
      recentBusinesses,
      businessTypes,
    ] = await Promise.all([
      Business.aggregate([
        {
          $lookup: {
            from: "businesstypes",
            localField: "businessTypeId",
            foreignField: "_id",
            as: "businessType",
          },
        },
        { $unwind: "$businessType" },
        { $group: { _id: "$businessType.code", count: { $sum: 1 } } },
      ]),
      Business.countDocuments({ status: "ACTIVE" }),
      Business.countDocuments({ status: "SUSPENDED" }),
      Business.countDocuments({
        planExpiresAt: { $gt: now, $lte: expiringAt },
      }),
      Business.find()
        .select("name status planExpiresAt businessTypeId ownerId createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("businessTypeId", "code name iconName")
        .populate("ownerId", "name")
        .lean(),
      // Include active zero-count types and retired types that still have registered businesses.
      BusinessType.find()
        .select("code name iconName isActive")
        .sort({ name: 1 })
        .lean(),
    ]);
    const byBusinessType = Object.fromEntries(
      summary.map(({ _id, count }) => [_id, count]),
    );
    return res.status(200).json({
      totalBusinesses: summary.reduce((total, item) => total + item.count, 0),
      byBusinessType,
      businessTypeDistribution: businessTypes
        .map((businessType) => ({
          code: businessType.code,
          name: businessType.name,
          iconName: businessType.iconName,
          isActive: businessType.isActive === true,
          count: byBusinessType[businessType.code] ?? 0,
        }))
        .filter((businessType) => businessType.isActive || businessType.count > 0),
      activeBusinesses,
      suspendedBusinesses,
      expiringBusinesses,
      recentBusinesses: recentBusinesses.map((business) => ({
        _id: business._id,
        name: business.name,
        status: business.status,
        planExpiresAt: business.planExpiresAt,
        createdAt: business.createdAt,
        ownerName: business.ownerId?.name ?? "Unknown owner",
        businessType: business.businessTypeId
          ? {
              code: business.businessTypeId.code,
              name: business.businessTypeId.name,
              iconName: business.businessTypeId.iconName,
            }
          : { code: "UNKNOWN", name: "Unknown type", iconName: "business" },
      })),
    });
  } catch (error) {
    console.error("Admin dashboard summary failed:", error);
    return res.status(500).json({ message: "Unable to load platform summary" });
  }
};

const listBusinesses = async (_req, res) => {
  try {
    // Platform admins list all businesses, including the platform-managed type and owner metadata.
    const businesses = await Business.find()
      .select(businessProjection)
      .sort({ createdAt: -1 })
      .populate("businessTypeId", "code name iconName")
      .populate("ownerId", "name email mobile")
      .lean();
    return res.status(200).json({ businesses });
  } catch (error) {
    console.error("Admin business list failed:", error);
    return res.status(500).json({ message: "Unable to load businesses" });
  }
};

const createBusiness = async (req, res) => {
  try {
    const input = validateBusinessCreation(req.body);
    if (
      await User.exists({
        $or: [{ email: input.email }, { mobile: input.mobile }],
      })
    )
      return res
        .status(409)
        .json({ message: "Unable to create business account" });
    const session = await mongoose.startSession();
    const generatedPassword = temporaryPassword();
    let business;
    let owner;
    try {
      await session.withTransaction(async () => {
        const businessType = await BusinessType.findOne({
          _id: input.businessTypeId,
          isActive: true,
        }).session(session);
        if (!businessType) {
          throw new AdminValidationError("Invalid business type");
        }
        const businessId = new mongoose.Types.ObjectId();
        owner = new User({
          name: input.ownerName,
          email: input.email,
          mobile: input.mobile,
          password: generatedPassword,
          role: "OWNER",
          businessId,
          passwordChangedAt: null,
        });
        business = new Business({
          _id: businessId,
          name: input.businessName,
          businessTypeId: businessType._id,
          ownerId: owner._id,
          status: "ACTIVE",
          planExpiresAt: input.planExpiresAt,
          createdByAdminId: req.user._id,
        });
        await owner.save({ session });
        await business.save({ session });
      });
    } finally {
      await session.endSession();
    }
    // This is the only response containing the generated password; never log it.
    return res.status(201).json({
      message: "Business created successfully",
      business: {
        ...business.toObject(),
        ownerId: {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          mobile: owner.mobile,
        },
      },
      temporaryPassword: generatedPassword,
    });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    if (error?.code === 11000)
      return res
        .status(409)
        .json({ message: "Unable to create business account" });
    console.error("Admin business creation failed:", error);
    return res.status(500).json({ message: "Unable to create business" });
  }
};

const updateBusinessStatus = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid business" });
    }
    const { status } = validateBusinessStatus(req.body);
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).select(businessProjection);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    return res
      .status(200)
      .json({ message: "Business status updated", business });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Admin business status update failed:", error);
    return res
      .status(500)
      .json({ message: "Unable to update business status" });
  }
};

const updatePlanExpiry = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id))
      return res.status(400).json({ message: "Invalid business" });
    const { planExpiresAt } = validatePlanExpiry(req.body);
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { planExpiresAt },
      { new: true },
    ).select(businessProjection);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    return res
      .status(200)
      .json({ message: "Business plan expiry updated", business });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Admin plan update failed:", error);
    return res.status(500).json({ message: "Unable to update plan expiry" });
  }
};

const resetOwnerPassword = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid business" });
    }
    const business = await Business.findById(req.params.id).select("ownerId");
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    const password = temporaryPassword();
    const owner = await User.findOne({
      _id: business.ownerId,
      businessId: business._id,
      role: "OWNER",
    }).select("+password");
    if (!owner) {
      return res.status(404).json({ message: "Business owner not found" });
    }
    owner.password = password;
    owner.passwordChangedAt = null;
    await owner.save();
    return res
      .status(200)
      .json({ message: "Owner password reset", temporaryPassword: password });
  } catch (error) {
    console.error("Admin password reset failed:", error);
    return res.status(500).json({ message: "Unable to reset owner password" });
  }
};

const listBusinessTypes = async (_req, res) => {
  try {
    // Platform administration includes inactive types so their lifecycle can be managed without deletion.
    const businessTypes = await BusinessType.find()
      .select("code name iconName isActive resourceTypes")
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ businessTypes: businessTypes.map(businessTypeResponse) });
  } catch (error) {
    console.error("Admin business type list failed:", error);
    return res.status(500).json({ message: "Unable to load business types" });
  }
};

const createBusinessType = async (req, res) => {
  try {
    const input = validateBusinessTypeCreation(req.body);
    if (await BusinessType.exists({ code: input.code })) {
      return res.status(409).json({ message: "This business type code already exists" });
    }
    // A code is a durable catalogue identifier used by businesses and dashboard aggregates.
    const businessType = await BusinessType.create({ ...input, resourceTypes: [], isActive: true });
    return res.status(201).json({
      message: "Business type created successfully",
      businessType: businessTypeResponse(businessType),
    });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This business type code already exists" });
    }
    console.error("Admin business type creation failed:", error);
    return res.status(500).json({ message: "Unable to create business type" });
  }
};

const updateBusinessType = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid business type" });
    }
    const update = validateBusinessTypeUpdate(req.body);
    // Code remains immutable because businesses persist the selected type ID and reports aggregate by code.
    const businessType = await BusinessType.findByIdAndUpdate(req.params.id, update, { new: true })
      .select("code name iconName isActive resourceTypes");
    if (!businessType) return res.status(404).json({ message: "Business type not found" });
    return res.status(200).json({
      message: "Business type updated",
      businessType: businessTypeResponse(businessType),
    });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Admin business type update failed:", error);
    return res.status(500).json({ message: "Unable to update business type" });
  }
};

const updateBusinessTypeStatus = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid business type" });
    }
    const { isActive } = validateBusinessTypeStatus(req.body);
    // Retiring a type prevents future registration and resource provisioning while retaining existing records.
    const businessType = await BusinessType.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true },
    ).select("code name iconName isActive resourceTypes");
    if (!businessType) return res.status(404).json({ message: "Business type not found" });
    return res.status(200).json({
      message: isActive ? "Business type activated" : "Business type deactivated",
      businessType: businessTypeResponse(businessType),
    });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Admin business type status update failed:", error);
    return res.status(500).json({ message: "Unable to update business type status" });
  }
};

const listResourceTypes = async (_req, res) => {
  try {
    // Flatten platform configuration only for administration; tenants still resolve types from their own business type.
    const businessTypes = await BusinessType.find()
      .select("code name isActive resourceTypes")
      .sort({ name: 1 })
      .lean();
    const resourceTypes = businessTypes.flatMap((businessType) =>
      businessType.resourceTypes.map((resourceType) => ({
        businessTypeId: businessType._id,
        businessTypeCode: businessType.code,
        businessTypeName: businessType.name,
        businessTypeIsActive: businessType.isActive,
        code: resourceType.code,
        name: resourceType.name,
        isPerson: resourceType.isPerson === true,
        isActive: resourceType.isActive === true,
      })),
    );
    return res.status(200).json({ resourceTypes });
  } catch (error) {
    console.error("Admin resource type list failed:", error);
    return res.status(500).json({ message: "Unable to load resource types" });
  }
};

const createResourceType = async (req, res) => {
  try {
    const input = validateResourceTypeCreation(req.body);
    const businessType = await BusinessType.findById(input.businessTypeId);
    if (!businessType) return res.status(404).json({ message: "Business type not found" });
    // A resource code is immutable once configured because tenant resource records persist that code.
    if (businessType.resourceTypes.some((resourceType) => resourceType.code === input.code)) {
      return res.status(409).json({ message: "This resource type already exists for the business type" });
    }
    businessType.resourceTypes.push({
      code: input.code,
      name: input.name,
      isPerson: input.isPerson,
      isActive: true,
    });
    await businessType.save();
    return res.status(201).json({
      message: "Resource type created successfully",
      resourceType: {
        businessTypeId: businessType._id,
        businessTypeCode: businessType.code,
        businessTypeName: businessType.name,
        businessTypeIsActive: businessType.isActive,
        code: input.code,
        name: input.name,
        isPerson: input.isPerson,
        isActive: true,
      },
    });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Admin resource type creation failed:", error);
    return res.status(500).json({ message: "Unable to create resource type" });
  }
};

const updateResourceType = async (req, res) => {
  try {
    const { businessTypeId, code } = req.params;
    if (!isValidResourceTypeRoute(businessTypeId, code)) {
      return res.status(400).json({ message: "Invalid resource type" });
    }
    const { name } = validateResourceTypeUpdate(req.body);
    // Only the display name can change; changing code/person semantics would invalidate existing resources.
    const businessType = await BusinessType.findOneAndUpdate(
      { _id: businessTypeId, "resourceTypes.code": code.toUpperCase() },
      { $set: { "resourceTypes.$.name": name } },
      { new: true },
    ).select("code name isActive resourceTypes");
    if (!businessType) return res.status(404).json({ message: "Resource type not found" });
    const resourceType = businessType.resourceTypes.find(
      (item) => item.code === code.toUpperCase(),
    );
    return res.status(200).json({
      message: "Resource type updated",
      resourceType: {
        businessTypeId: businessType._id,
        businessTypeCode: businessType.code,
        businessTypeName: businessType.name,
        businessTypeIsActive: businessType.isActive,
        code: resourceType.code,
        name: resourceType.name,
        isPerson: resourceType.isPerson === true,
        isActive: resourceType.isActive === true,
      },
    });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Admin resource type update failed:", error);
    return res.status(500).json({ message: "Unable to update resource type" });
  }
};

const updateResourceTypeStatus = async (req, res) => {
  try {
    const { businessTypeId, code } = req.params;
    if (!isValidResourceTypeRoute(businessTypeId, code)) {
      return res.status(400).json({ message: "Invalid resource type" });
    }
    const { isActive } = validateResourceTypeStatus(req.body);
    // Deactivation retires the type from new resource creation while retaining historic resource records.
    const businessType = await BusinessType.findOneAndUpdate(
      { _id: businessTypeId, "resourceTypes.code": code.toUpperCase() },
      { $set: { "resourceTypes.$.isActive": isActive } },
      { new: true },
    ).select("code name isActive resourceTypes");
    if (!businessType) return res.status(404).json({ message: "Resource type not found" });
    const resourceType = businessType.resourceTypes.find(
      (item) => item.code === code.toUpperCase(),
    );
    return res.status(200).json({
      message: isActive ? "Resource type activated" : "Resource type deactivated",
      resourceType: {
        businessTypeId: businessType._id,
        businessTypeCode: businessType.code,
        businessTypeName: businessType.name,
        businessTypeIsActive: businessType.isActive,
        code: resourceType.code,
        name: resourceType.name,
        isPerson: resourceType.isPerson === true,
        isActive: resourceType.isActive === true,
      },
    });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Admin resource type status update failed:", error);
    return res.status(500).json({ message: "Unable to update resource type status" });
  }
};

export {
  createBusiness,
  createBusinessType,
  createResourceType,
  getSummary,
  listBusinesses,
  listBusinessTypes,
  listResourceTypes,
  resetOwnerPassword,
  updateBusinessStatus,
  updateBusinessType,
  updateBusinessTypeStatus,
  updatePlanExpiry,
  updateResourceType,
  updateResourceTypeStatus,
};
