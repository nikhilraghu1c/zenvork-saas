import { generateReply as generateMockReply } from "./providers/mock-assistant.provider.js";
import { generateReply as generateGeminiReply } from "./providers/gemini-assistant.provider.js";
import { environment } from "../../config/environment.js";
import { AssistantProviderConfigurationError } from "./providers/assistant-provider.errors.js";

const MAX_CONTEXT_MESSAGES = 20;

const ASSISTANT_SYSTEM_INSTRUCTION = `You are Zenvork AI Assistant for business owners and staff.

Help users plan their work, draft client communication, and understand Zenvork features. Keep replies clear, practical, and concise.

Do not claim to have access to bookings, revenue, clients, staff, analytics, or any other business data unless it is supplied through an authorized tool or context. No business-data tools are available yet, so never invent figures, appointments, client details, or app actions. State the limitation briefly and suggest a useful next action.

Protect privacy: do not request passwords, API keys, payment-card details, or other secrets. Do not provide professional medical, legal, or financial advice; suggest an appropriate qualified professional where needed.`;

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

// Provider boundary: future Gemini, OpenAI, or Groq adapters implement the same generateReply contract.
const generateAssistantReply = async ({ messages }) => {
  const provider = providers[environment.AI_PROVIDER];
  if (!provider) {
    throw new AssistantProviderConfigurationError(
      `AI provider "${environment.AI_PROVIDER}" is not configured`,
    );
  }
  return provider.generateReply({
    messages: recentConversationContext(messages),
    systemInstruction: ASSISTANT_SYSTEM_INSTRUCTION,
  });
};

export { AssistantProviderConfigurationError, generateAssistantReply };
