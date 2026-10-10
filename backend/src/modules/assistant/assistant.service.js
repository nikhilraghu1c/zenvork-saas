import { generateReply as generateMockReply } from "./providers/mock-assistant.provider.js";
import { generateReply as generateGeminiReply } from "./providers/gemini-assistant.provider.js";
import { environment } from "../../config/environment.js";
import { AssistantProviderConfigurationError } from "./providers/assistant-provider.errors.js";
import {
  getRelevantZenvorkKnowledge,
  isAssistantScopedQuestion,
} from "./knowledge/assistant-knowledge.service.js";
import { buildAssistantSystemInstruction } from "./instructions/assistant-system-instruction.js";

const MAX_CONTEXT_MESSAGES = 20;
const OUT_OF_SCOPE_REPLY =
  "I’m Zenvork’s business assistant. I can help with Zenvork features, booking workflows, client communication, reminders, and planning your business day.";

const providers = {
  mock: { generateReply: generateMockReply },
  gemini: { generateReply: generateGeminiReply },
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

// Provider boundary: future Gemini, OpenAI, or Groq adapters implement the same generateReply contract.
const generateAssistantReply = async ({ messages }) => {
  const provider = providers[environment.AI_PROVIDER];
  if (!provider) {
    throw new AssistantProviderConfigurationError(
      `AI provider "${environment.AI_PROVIDER}" is not configured`,
    );
  }
  const userMessage = latestUserMessage(messages);
  const knowledge = getRelevantZenvorkKnowledge(userMessage);
  // Unrelated questions do not consume a provider request or receive a general-knowledge answer.
  if (!isAssistantScopedQuestion(userMessage, knowledge)) return OUT_OF_SCOPE_REPLY;
  return provider.generateReply({
    messages: recentConversationContext(messages),
    systemInstruction: buildAssistantSystemInstruction(knowledge),
  });
};

export { AssistantProviderConfigurationError, generateAssistantReply };
