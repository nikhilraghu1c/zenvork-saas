import mongoose from "mongoose";

const assistantMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["USER", "ASSISTANT"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } },
);

const assistantConversationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: "New conversation",
    },
    messages: {
      type: [assistantMessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // The TTL index removes both the conversation and its embedded messages after seven idle days.
    purgeAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Keeps each user's session history private while still enforcing tenant isolation in every lookup.
assistantConversationSchema.index({
  businessId: 1,
  userId: 1,
  lastMessageAt: -1,
});
// MongoDB deletes an inactive conversation and its embedded messages together at this timestamp.
assistantConversationSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model(
  "AssistantConversation",
  assistantConversationSchema,
);
