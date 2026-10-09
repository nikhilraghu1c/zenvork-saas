import { Router } from "express";
import {
  addMessage,
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
  updateConversation,
} from "./assistant.controller.js";

const assistantRouter = Router();

// All assistant routes derive both tenant and user ownership from authenticated middleware state.
assistantRouter.get("/conversations", getConversations);
assistantRouter.post("/conversations", createConversation);
assistantRouter.get("/conversations/:id", getConversation);
assistantRouter.patch("/conversations/:id", updateConversation);
assistantRouter.delete("/conversations/:id", deleteConversation);
assistantRouter.post("/conversations/:id/messages", addMessage);

export default assistantRouter;
