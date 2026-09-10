import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z][A-Z0-9_]*$/, "Resource type must use uppercase letters, numbers, or underscores"],
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Resource name must be at least 3 characters long"],
      maxlength: [50, "Resource name cannot exceed 50 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Supports tenant-scoped resource lists and filtering by resource type.
resourceSchema.index({ businessId: 1, resourceType: 1 });

export default mongoose.model("Resource", resourceSchema);
