import { environment } from "../config/environment.js";

const supportedSameSiteValues = new Set(["lax", "none", "strict"]);
const normalizedSameSite = environment.COOKIE_SAME_SITE.toLowerCase();

if (!supportedSameSiteValues.has(normalizedSameSite)) {
  throw new Error("COOKIE_SAME_SITE must be lax, none, or strict");
}

// Keep login and logout cookie attributes identical so browsers reliably clear the session.
export const authCookieOptions = {
  httpOnly: true,
  sameSite: normalizedSameSite,
  secure: environment.NODE_ENV === "production",
};
