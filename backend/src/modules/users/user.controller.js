import User from "./user.model.js";
import mongoose from "mongoose";
import { tenantData, tenantFilter } from "../../utils/tenant-scope.js";
import {
  UserValidationError,
  validateStaffCreation,
  validateStaffStatusUpdate,
} from "./user.validation.js";

const duplicateStaffCredentialMessage =
  "This mobile number or email is already used by another account";

const getStaffUsers = async (req, res) => {
  try {
    // Every staff list is constrained to the authenticated owner's business.
    const users = await User.find(
      tenantFilter(req, {
        role: "STAFF",
      }),
    )
      .select("name email mobile role isActive createdAt updatedAt")
      // Keep the operationally available staff first, followed by a stable alphabetical order.
      .sort({ isActive: -1, name: 1, _id: 1 })
      .lean();

    // Legacy staff records without this field remain active after the lifecycle field is introduced.
    return res.status(200).json({
      users: users.map((user) => ({ ...user, isActive: user.isActive !== false })),
    });
  } catch (error) {
    console.error("Failed to load staff users:", error);
    return res.status(500).json({ message: "Unable to load staff users" });
  }
};

const createStaffUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = validateStaffCreation(req.body);
    const duplicateCriteria = [{ mobile }];

    if (email) {
      duplicateCriteria.push({ email });
    }

    // Check likely duplicates early; the database unique indexes still handle race conditions.
    const existingUser = await User.exists({ $or: duplicateCriteria });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: duplicateStaffCredentialMessage });
    }

    await User.create(
      tenantData(req, {
        name,
        email,
        mobile,
        password,
        role: "STAFF",
      }),
    );

    return res.status(201).json({ message: "Staff user created successfully" });
  } catch (error) {
    if (error instanceof UserValidationError) {
      return res.status(400).json({ message: error.message });
    }

    // A concurrent request can pass the pre-check, so return the same safe duplicate credential message.
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ message: duplicateStaffCredentialMessage });
    }

    console.error("Staff user creation failed:", error);
    return res.status(500).json({ message: "Unable to create staff account" });
  }
};

const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ message: "Invalid staff member" });
    }

    const { isActive } = validateStaffStatusUpdate(req.body);
    // Tenant and role constraints ensure an owner can change only a staff account from their own business.
    const staffUser = await User.findOne(
      tenantFilter(req, { _id: id, role: "STAFF" }),
    );
    if (!staffUser) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    staffUser.isActive = isActive;
    await staffUser.save();

    return res.status(200).json({
      message: isActive ? "Staff member activated" : "Staff member deactivated",
      user: {
        _id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email ?? undefined,
        mobile: staffUser.mobile,
        role: staffUser.role,
        isActive: staffUser.isActive,
        createdAt: staffUser.createdAt,
        updatedAt: staffUser.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof UserValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Staff status update failed:", error);
    return res.status(500).json({ message: "Unable to update staff status" });
  }
};

export { createStaffUser, getStaffUsers, updateStaffStatus };
