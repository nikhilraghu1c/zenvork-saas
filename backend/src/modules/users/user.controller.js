import User from "./user.model.js";
import {
  UserValidationError,
  validateStaffCreation,
} from "./user.validation.js";

const getStaffUsers = async (req, res) => {
  try {
    // Every staff list is constrained to the authenticated owner's business.
    const users = await User.find({
      businessId: req.user.businessId,
      role: "STAFF",
    })
      .select("name email mobile role createdAt updatedAt")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ users });
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
        .json({ message: "Unable to create staff account" });
    }

    await User.create({
      businessId: req.user.businessId,
      name,
      email,
      mobile,
      password,
      role: "STAFF",
    });

    return res.status(201).json({ message: "Staff user created successfully" });
  } catch (error) {
    if (error instanceof UserValidationError) {
      return res.status(400).json({ message: error.message });
    }

    // A concurrent request can pass the pre-check, so preserve a generic conflict response.
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ message: "Unable to create staff account" });
    }

    console.error("Staff user creation failed:", error);
    return res.status(500).json({ message: "Unable to create staff account" });
  }
};

export { createStaffUser, getStaffUsers };
