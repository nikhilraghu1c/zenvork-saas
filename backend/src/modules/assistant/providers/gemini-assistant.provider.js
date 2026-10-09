import { GoogleGenAI } from "@google/genai";
import { environment } from "../../../config/environment.js";
import {
  AssistantProviderConfigurationError,
  AssistantProviderRequestError,
} from "./assistant-provider.errors.js";

const REQUEST_TIMEOUT_MS = 30_000;

const toGeminiContents = (messages) =>
  messages.map((message) => ({
    role: message.role === "ASSISTANT" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

// Prevents an unavailable provider from leaving the authenticated client request pending indefinitely.
const withTimeout = async (request) => {
  let timeoutId;
  try {
    return await Promise.race([
      request,
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new AssistantProviderRequestError("Gemini request timed out")),
          REQUEST_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

// Sends only the authenticated user's conversation text; tenant records are never included here.
const generateReply = async ({ messages }) => {
  if (!environment.GEMINI_API_KEY) {
    throw new AssistantProviderConfigurationError("GEMINI_API_KEY is required");
  }
  if (!environment.AI_MODEL) {
    throw new AssistantProviderConfigurationError("AI_MODEL is required");
  }

  try {
    const client = new GoogleGenAI({ apiKey: environment.GEMINI_API_KEY });
    const response = await withTimeout(
      client.models.generateContent({
        model: environment.AI_MODEL,
        contents: toGeminiContents(messages),
      }),
    );
    const reply = response.text?.trim();
    if (!reply) throw new AssistantProviderRequestError("Gemini returned no text response");
    return reply;
  } catch (error) {
    if (
      error instanceof AssistantProviderConfigurationError ||
      error instanceof AssistantProviderRequestError
    ) {
      throw error;
    }
    console.error("Gemini assistant request failed:", error.message);
    throw new AssistantProviderRequestError("Gemini request failed");
  }
};

export { generateReply };
