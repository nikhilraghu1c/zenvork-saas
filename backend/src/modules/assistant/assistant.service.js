import {
  classifyRequest as classifyMockRequest,
  generateReply as generateMockReply,
} from "./providers/mock-assistant.provider.js";
import {
  classifyRequest as classifyGeminiRequest,
  generateReply as generateGeminiReply,
} from "./providers/gemini-assistant.provider.js";
import { environment } from "../../config/environment.js";
import { AssistantProviderConfigurationError } from "./providers/assistant-provider.errors.js";
import {
  AssistantRequestClassification,
  classifyAssistantRequest,
} from "./classification/assistant-request-classifier.service.js";
import { getRelevantZenvorkKnowledge } from "./knowledge/assistant-knowledge.service.js";
import { buildAssistantSystemInstruction } from "./instructions/assistant-system-instruction.js";

const MAX_CONTEXT_MESSAGES = 20;
const OUT_OF_SCOPE_REPLY =
  "I’m Zenvork’s business assistant. I can help with Zenvork features, booking workflows, client communication, reminders, and planning your business day.";

const providers = {
  mock: { classifyRequest: classifyMockRequest, generateReply: generateMockReply },
  gemini: { classifyRequest: classifyGeminiRequest, generateReply: generateGeminiReply },
};

// Limits provider context while ensuring a retained history starts with a user message.
const recentConversationContext = (messages) => {
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
  return recentMessages[0]?.role === "ASSISTANT"
    ? recentMessages.slice(1)
    : recentMessages;
};

const latestUserMessage = (messages) =>
  [...messages].reverse().find((message) => message.role === "USER")?.content ?? "";

// Provider boundary: future adapters implement the same classifyRequest and generateReply contract.
const generateAssistantReply = async ({ messages }) => {
  const provider = providers[environment.AI_PROVIDER];
  if (!provider) {
    throw new AssistantProviderConfigurationError(
      `AI provider "${environment.AI_PROVIDER}" is not configured`,
    );
  }
  const userMessage = latestUserMessage(messages);
  const request = await classifyAssistantRequest({
    message: userMessage,
    classifyWithProvider: provider.classifyRequest,
  });

  // Local policy replies never expose restricted requests or unrelated prompts to an AI provider.
  if (request.type === AssistantRequestClassification.UNSAFE_OR_RESTRICTED) return request.reply;
  if (request.type === AssistantRequestClassification.OUT_OF_SCOPE) return OUT_OF_SCOPE_REPLY;

  const knowledge =
    request.type === AssistantRequestClassification.PRODUCT_HELP
      ? getRelevantZenvorkKnowledge(userMessage)
      : "";

  return provider.generateReply({
    messages: recentConversationContext(messages),
    systemInstruction: buildAssistantSystemInstruction(knowledge),
  });
};

export { AssistantProviderConfigurationError, generateAssistantReply };
