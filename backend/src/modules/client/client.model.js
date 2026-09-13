import mongoose from "mongoose";
import validator from "validator";

const clientSchema = new mongoose.Schema(
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
      minlength: [3, "Client name must be at least 3 characters long"],
      maxlength: [50, "Client name cannot exceed 50 characters"],
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => /^[6-9]\d{9}$/.test(value),
        message: "Please provide a valid 10-digit mobile number",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 255,
      validate: {
        validator: (value) => value === undefined || validator.isEmail(value),
        message: "Invalid email format",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

clientSchema.index({ businessId: 1, mobile: 1 });

export default mongoose.model("Client", clientSchema);
