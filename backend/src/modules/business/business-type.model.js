import mongoose from "mongoose";

const resourceTypeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z][A-Z0-9_]*$/, "Resource type code must use uppercase letters, numbers, or underscores"],
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, "Resource type name cannot exceed 50 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const businessTypeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z][A-Z0-9_]*$/, "Business type code must use uppercase letters, numbers, or underscores"],
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, "Business type name cannot exceed 50 characters"],
    },
    iconName: {
      type: String,
      required: true,
      trim: true,
      default: "business",
    },
    resourceTypes: {
      type: [resourceTypeSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("BusinessType", businessTypeSchema);
