import { generateReply as generateMockReply } from "./providers/mock-assistant.provider.js";
import { generateReply as generateGeminiReply } from "./providers/gemini-assistant.provider.js";
import { environment } from "../../config/environment.js";
import { AssistantProviderConfigurationError } from "./providers/assistant-provider.errors.js";

const providers = {
  mock: { generateReply: generateMockReply },
  gemini: { generateReply: generateGeminiReply },
};

// Provider boundary: future Gemini, OpenAI, or Groq adapters implement the same generateReply contract.
const generateAssistantReply = async ({ messages }) => {
  const provider = providers[environment.AI_PROVIDER];
  if (!provider) {
    throw new AssistantProviderConfigurationError(
      `AI provider "${environment.AI_PROVIDER}" is not configured`,
    );
  }
  return provider.generateReply({ messages });
};

export { AssistantProviderConfigurationError, generateAssistantReply };
