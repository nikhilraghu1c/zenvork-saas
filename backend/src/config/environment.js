import dotenv from "dotenv";

dotenv.config();

export const environment = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV || "development",
  ACCESS_TKN_SECRET: process.env.ACCESS_TKN_SECRET,
  ACCESS_TKN_EXPIRE: process.env.ACCESS_TKN_EXPIRE,
};
