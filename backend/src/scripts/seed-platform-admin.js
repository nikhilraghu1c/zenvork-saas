import "../config/environment.js";
import mongoose from "mongoose";
import { environment } from "../config/environment.js";
import connectDB from "../config/db.js";
import User from "../modules/users/user.model.js";

const {
  PLATFORM_ADMIN_NAME,
  PLATFORM_ADMIN_EMAIL,
  PLATFORM_ADMIN_MOBILE,
  PLATFORM_ADMIN_PASSWORD,
} = process.env;
if (
  ![
    PLATFORM_ADMIN_NAME,
    PLATFORM_ADMIN_EMAIL,
    PLATFORM_ADMIN_MOBILE,
    PLATFORM_ADMIN_PASSWORD,
  ].every(Boolean)
)
  throw new Error(
    "Set PLATFORM_ADMIN_NAME, PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_MOBILE, and PLATFORM_ADMIN_PASSWORD",
  );

await connectDB();
if (
  await User.exists({
    $or: [
      { email: PLATFORM_ADMIN_EMAIL.toLowerCase() },
      { mobile: PLATFORM_ADMIN_MOBILE },
    ],
  })
)
  throw new Error("Platform admin email or mobile already exists");
await User.create({
  name: PLATFORM_ADMIN_NAME,
  email: PLATFORM_ADMIN_EMAIL.toLowerCase(),
  mobile: PLATFORM_ADMIN_MOBILE,
  password: PLATFORM_ADMIN_PASSWORD,
  role: "PLATFORM_ADMIN",
  businessId: null,
  passwordChangedAt: new Date(),
});
console.log("Platform admin seeded successfully");
await mongoose.disconnect();
