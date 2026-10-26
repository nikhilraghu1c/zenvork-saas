import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Only a SHA-256 hash is persisted, so a database leak cannot replay a refresh session.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    // MongoDB's TTL monitor removes expired sessions without application cleanup work.
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AuthSession", authSessionSchema);
