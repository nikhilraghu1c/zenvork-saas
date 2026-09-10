import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: [5, "Business name must be at least 5 characters long"],
      maxlength: [100, "Business name cannot exceed 100 characters"],
      trim: true,
    },
    businessTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessType",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Business", businessSchema);
