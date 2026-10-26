import crypto from "node:crypto";
import { environment } from "../../config/environment.js";
import AuthSession from "./auth-session.model.js";

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

const createRawToken = () => {
  return crypto.randomBytes(48).toString("base64url");
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const refreshExpiryDate = () => {
  return new Date(Date.now() + refreshTokenLifetimeMs());
};

/** Creates a server-revocable refresh session while returning only its opaque browser token. */
const createRefreshSession = async (userId) => {
  const token = createRawToken();
  await AuthSession.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: refreshExpiryDate(),
  });
  return token;
};

/** Looks up an unexpired refresh session using the submitted token's one-way hash. */
const findRefreshSession = async (token) => {
  if (typeof token !== "string" || !token) {
    return null;
  }

  return AuthSession.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");
};

/** Rotates the token atomically so a second use of the old token is rejected. */
const rotateRefreshSession = async (session, oldToken) => {
  const token = createRawToken();
  const rotatedSession = await AuthSession.findOneAndUpdate(
    {
      _id: session._id,
      tokenHash: hashToken(oldToken),
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        tokenHash: hashToken(token),
        expiresAt: refreshExpiryDate(),
      },
    },
    { new: true },
  );

  return rotatedSession ? token : null;
};

/** Revokes the browser's current refresh session during logout or failed account validation. */
const revokeRefreshSession = async (token) => {
  if (typeof token !== "string" || !token) {
    return;
  }

  await AuthSession.deleteOne({ tokenHash: hashToken(token) });
};

/** Password changes revoke every remembered browser session for the account. */
const revokeAllRefreshSessions = async (userId) => {
  await AuthSession.deleteMany({ userId });
};

export {
  createRefreshSession,
  findRefreshSession,
  rotateRefreshSession,
  revokeRefreshSession,
  revokeAllRefreshSessions,
};
