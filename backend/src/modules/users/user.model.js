import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
      trim: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    email: {
      type: String,
      // Owners require email; staff can use their unique mobile number to log in instead.
      required: function () {
        return this.role === "OWNER";
      },
      unique: true,
      sparse: true,
      maxlength: 100,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) => value === undefined || validator.isEmail(value),
        message: "Please provide a valid email address",
      },
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (value) => /^[6-9]\d{9}$/.test(value),
        message: "Please provide a valid 10-digit mobile number",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
      maxlength: [128, "Password cannot exceed 128 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["OWNER", "STAFF"],
      default: "STAFF",
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to hash the password before saving the user document
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model("User", userSchema);
