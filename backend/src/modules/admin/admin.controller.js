import crypto from "node:crypto";
import mongoose from "mongoose";
import Business from "../business/business.model.js";
import BusinessType from "../business/business-type.model.js";
import User from "../users/user.model.js";
import {
  AdminValidationError,
  validateBusinessCreation,
  validateBusinessStatus,
  validatePlanExpiry,
} from "./admin.validation.js";

const temporaryPassword = () => crypto.randomBytes(18).toString("base64url");
const businessProjection =
  "name businessTypeId ownerId status planExpiresAt createdByAdminId createdAt updatedAt";

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
    ]);
    const byBusinessType = Object.fromEntries(
      summary.map(({ _id, count }) => [_id, count]),
    );
    return res.status(200).json({
      totalBusinesses: summary.reduce((total, item) => total + item.count, 0),
      byBusinessType,
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

export {
  createBusiness,
  getSummary,
  listBusinesses,
  resetOwnerPassword,
  updateBusinessStatus,
  updatePlanExpiry,
};
