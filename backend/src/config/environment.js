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
  // Refresh sessions are opaque database-backed tokens rather than JWTs and may outlive access tokens.
  REFRESH_TKN_EXPIRE: process.env.REFRESH_TKN_EXPIRE || "30d",
  AI_PROVIDER: (process.env.AI_PROVIDER || "mock").toLowerCase(),
  AI_MODEL: process.env.AI_MODEL || "",
  AI_CLASSIFIER_MODEL: process.env.AI_CLASSIFIER_MODEL || process.env.AI_MODEL || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};
