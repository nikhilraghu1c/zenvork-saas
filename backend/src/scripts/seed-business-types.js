import mongoose from "mongoose";
import connectDB from "../config/db.js";
import BusinessType from "../modules/business/business-type.model.js";

const initialBusinessTypes = [
  {
    code: "SALON",
    name: "Salon",
    iconName: "content_cut",
    resourceTypes: [
      { code: "STYLIST", name: "Stylist", isPerson: true, isActive: true },
      { code: "CHAIR", name: "Chair", isPerson: false, isActive: true },
    ],
    isActive: true,
  },
  {
    code: "CLINIC",
    name: "Clinic",
    iconName: "medical_services",
    resourceTypes: [{ code: "DOCTOR", name: "Doctor", isPerson: true, isActive: true }],
    isActive: true,
  },
];

const seedBusinessTypes = async () => {
  await connectDB();

  await BusinessType.bulkWrite(
    initialBusinessTypes.map((businessType) => ({
      updateOne: {
        filter: { code: businessType.code },
        update: { $setOnInsert: businessType },
        upsert: true,
      },
    })),
  );

  console.log("Business type seed completed");
  await mongoose.disconnect();
};

seedBusinessTypes().catch(async (error) => {
  console.error("Business type seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
