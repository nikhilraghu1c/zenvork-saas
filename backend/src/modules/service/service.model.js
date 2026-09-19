import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Service name must be at least 1 character long"],
      maxlength: [100, "Service name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Service description cannot exceed 500 characters"],
      default: "",
    },
    pricePaise: { type: Number, required: true, min: [0, "Price must be a positive number"] },
    durationMinutes: { type: Number, required: true, min: [1, "Duration must be at least 1 minute"], max: [1440, "Duration cannot exceed 1440 minutes"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// A service name is unique within one business, while different tenants may use the same name.
serviceSchema.index({ businessId: 1, name: 1 }, { unique: true });

export default mongoose.model("Service", serviceSchema);
