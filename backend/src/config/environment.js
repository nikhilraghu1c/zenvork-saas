import dotenv from "dotenv";

dotenv.config();

export const environment = {
  PORT: process.env.PORT || 4001,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:4200",
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || "strict",
  ACCESS_TKN_SECRET: process.env.ACCESS_TKN_SECRET,
  ACCESS_TKN_EXPIRE: process.env.ACCESS_TKN_EXPIRE,
};
