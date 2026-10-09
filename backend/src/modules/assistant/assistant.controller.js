import mongoose from "mongoose";
import AssistantConversation from "./assistant.model.js";
import {
  AssistantValidationError,
  validateConversationTitle,
  validateMessage,
} from "./assistant.validation.js";
import {
  AssistantProviderConfigurationError,
  generateAssistantReply,
} from "./assistant.service.js";
import { AssistantProviderRequestError } from "./providers/assistant-provider.errors.js";
import { tenantFilter, tenantId } from "../../utils/tenant-scope.js";

const INACTIVITY_DAYS = 7;
const inactivityDate = (now = new Date()) =>
  new Date(now.getTime() + INACTIVITY_DAYS * 24 * 60 * 60 * 1000);

const conversationFilter = (req, id) =>
  tenantFilter(req, { _id: id, userId: req.user._id });

const toSummary = (conversation) => ({
  _id: conversation._id,
  title: conversation.title,
  lastMessageAt: conversation.lastMessageAt,
  createdAt: conversation.createdAt,
});

const toConversation = (conversation) => ({
  ...toSummary(conversation),
  messages: conversation.messages.map((message) => ({
    _id: message._id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  })),
});

const isValidId = (id) => mongoose.isObjectIdOrHexString(id);

const createConversation = async (req, res) => {
  try {
    const now = new Date();
    // Tenant and owner identity are always derived from the authenticated cookie session.
    const conversation = await AssistantConversation.create({
      businessId: tenantId(req),
      userId: req.user._id,
      lastMessageAt: now,
      purgeAt: inactivityDate(now),
    });
    return res.status(201).json({ conversation: toConversation(conversation) });
  } catch (error) {
    console.error("Failed to create assistant conversation:", error);
    return res.status(500).json({ message: "Unable to create a conversation" });
  }
};

const getConversations = async (req, res) => {
  try {
    // User ownership prevents staff and owners from reading each other's private sessions.
    const conversations = await AssistantConversation.find(
      tenantFilter(req, { userId: req.user._id }),
    )
      .sort({ lastMessageAt: -1, _id: -1 })
      .select("title lastMessageAt createdAt")
      .lean();
    return res
      .status(200)
      .json({ conversations: conversations.map(toSummary) });
  } catch (error) {
    console.error("Failed to retrieve assistant conversations:", error);
    return res
      .status(500)
      .json({ message: "Unable to retrieve conversations" });
  }
};

const getConversation = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }
    const conversation = await AssistantConversation.findOne(
      conversationFilter(req, req.params.id),
    ).lean();
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });
    return res.status(200).json({ conversation: toConversation(conversation) });
  } catch (error) {
    console.error("Failed to retrieve assistant conversation:", error);
    return res.status(500).json({ message: "Unable to retrieve conversation" });
  }
};

const updateConversation = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }
    const title = validateConversationTitle(req.body);
    const conversation = await AssistantConversation.findOneAndUpdate(
      conversationFilter(req, req.params.id),
      { $set: { title } },
      { new: true },
    ).lean();
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });
    return res.status(200).json({ conversation: toConversation(conversation) });
  } catch (error) {
    if (error instanceof AssistantValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Failed to update assistant conversation:", error);
    return res.status(500).json({ message: "Unable to update conversation" });
  }
};

const deleteConversation = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }
    // Deleting the parent document also deletes every embedded chat message atomically.
    const conversation = await AssistantConversation.findOneAndDelete(
      conversationFilter(req, req.params.id),
    );
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });
    return res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Failed to delete assistant conversation:", error);
    return res.status(500).json({ message: "Unable to delete conversation" });
  }
};

const addMessage = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }
    const content = validateMessage(req.body);
    const now = new Date();
    const conversation = await AssistantConversation.findOne(
      conversationFilter(req, req.params.id),
    );
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    // The provider receives only this private conversation's messages, never tenant records.
    const reply = await generateAssistantReply({
      messages: [...conversation.messages, { role: "USER", content }],
    });

    conversation.messages.push({ role: "USER", content, createdAt: now });
    conversation.messages.push({
      role: "ASSISTANT",
      content: reply,
      createdAt: now,
    });
    if (
      conversation.messages.length === 2 &&
      conversation.title === "New conversation"
    ) {
      conversation.title = content.slice(0, 100);
    }
    // Every message extends the seven-day retention window for the entire private session.
    conversation.lastMessageAt = now;
    conversation.purgeAt = inactivityDate(now);
    await conversation.save();
    return res.status(201).json({ conversation: toConversation(conversation) });
  } catch (error) {
    if (error instanceof AssistantValidationError) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof AssistantProviderConfigurationError) {
      return res.status(503).json({ message: "AI Assistant is not configured" });
    }
    if (error instanceof AssistantProviderRequestError) {
      return res.status(503).json({ message: "AI Assistant is temporarily unavailable" });
    }
    console.error("Failed to add assistant message:", error);
    return res.status(500).json({ message: "Unable to send message" });
  }
};

export {
  addMessage,
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
  updateConversation,
};
