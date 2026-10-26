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
  path: "/api",
};

const refreshTokenLifetimeMs = () => {
  const match = /^(\d+)([smhd])$/.exec(environment.REFRESH_TKN_EXPIRE);
  if (!match) {
    throw new Error("REFRESH_TKN_EXPIRE must use a whole-number s, m, h, or d duration");
  }

  const amount = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  if (!Number.isSafeInteger(amount) || amount < 1 || !unitMs) {
    throw new Error("REFRESH_TKN_EXPIRE must be a positive whole-number duration");
  }
  return amount * unitMs;
};

// The durable refresh cookie survives a browser restart but remains unreadable to JavaScript.
export const refreshCookieOptions = {
  ...authCookieOptions,
  maxAge: refreshTokenLifetimeMs(),
};
