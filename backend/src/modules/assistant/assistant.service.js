import {
  classifyRequest as classifyMockRequest,
  extractAppointmentAgendaQuery as extractMockAppointmentAgendaQuery,
  extractRevenueQuery as extractMockRevenueQuery,
  generateReply as generateMockReply,
} from "./providers/mock-assistant.provider.js";
import {
  classifyRequest as classifyGeminiRequest,
  extractAppointmentAgendaQuery as extractGeminiAppointmentAgendaQuery,
  extractRevenueQuery as extractGeminiRevenueQuery,
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
import { getBusinessDateParts } from "../../utils/reporting-period.js";
import { getRevenueSummary } from "./tools/revenue-summary.tool.js";
import { formatRevenueSummary } from "./tools/revenue-summary.formatter.js";
import { getAppointmentAgenda } from "./tools/appointment-agenda.tool.js";
import { formatAppointmentAgenda } from "./tools/appointment-agenda.formatter.js";
import {
  AssistantToolAuthorizationError,
  AssistantToolValidationError,
} from "./tools/assistant-tool.errors.js";
import { AssistantToolRoute } from "./tools/assistant-tool-route.js";

const MAX_CONTEXT_MESSAGES = 20;
const OUT_OF_SCOPE_REPLY =
  "I’m Zenvork’s business assistant. I can help with Zenvork features, booking workflows, client communication, reminders, and planning your business day.";

const providers = {
  mock: {
    classifyRequest: classifyMockRequest,
    extractAppointmentAgendaQuery: extractMockAppointmentAgendaQuery,
    extractRevenueQuery: extractMockRevenueQuery,
    generateReply: generateMockReply,
  },
  gemini: {
    classifyRequest: classifyGeminiRequest,
    extractAppointmentAgendaQuery: extractGeminiAppointmentAgendaQuery,
    extractRevenueQuery: extractGeminiRevenueQuery,
    generateReply: generateGeminiReply,
  },
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

const currentBusinessDate = () => {
  const { year, month, day } = getBusinessDateParts(new Date());
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Provider boundary: future adapters implement the same classifyRequest and generateReply contract.
const generateAssistantReply = async ({ messages, businessId, userRole }) => {
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

  if (request.type === AssistantRequestClassification.DATA_QUERY) {
    if (request.tool === AssistantToolRoute.UNSUPPORTED_DATA_QUERY) {
      return "I don’t support that live business-data question yet. Right now I can provide aggregate revenue summaries and show appointments for one day.";
    }
    if (request.tool === AssistantToolRoute.GET_APPOINTMENT_AGENDA) {
      try {
        const agendaQuery = await provider.extractAppointmentAgendaQuery({
          message: userMessage,
          currentBusinessDate: currentBusinessDate(),
        });
        console.info("Assistant appointment agenda date extraction:", agendaQuery);
        if (agendaQuery.type === "DATE_RANGE") {
          return "I can show appointments for one day at a time. Try “What appointments do I have today?”";
        }
        if (agendaQuery.type !== "ONE_DAY") {
          return "Please ask for appointments on one day, such as “What appointments do I have today?”";
        }
        const agenda = await getAppointmentAgenda({
          businessId,
          userRole,
          date: agendaQuery.date,
        });
        return formatAppointmentAgenda(agenda);
      } catch (error) {
        if (error instanceof AssistantToolAuthorizationError) {
          return "You do not have access to appointment information.";
        }
        if (error instanceof AssistantToolValidationError) {
          return "Please ask for appointments on a valid day, such as “What appointments do I have today?”";
        }
        throw error;
      }
    }
    if (request.tool !== AssistantToolRoute.GET_REVENUE_SUMMARY) {
      return OUT_OF_SCOPE_REPLY;
    }

    try {
      const dates = await provider.extractRevenueQuery({
        message: userMessage,
        currentBusinessDate: currentBusinessDate(),
      });
      console.info("Assistant revenue date extraction:", dates);
      const summary = await getRevenueSummary({
        businessId,
        userRole,
        ...dates,
      });
      return formatRevenueSummary(summary);
    } catch (error) {
      if (error instanceof AssistantToolAuthorizationError) {
        return "Revenue information is available only to the business owner.";
      }
      if (error instanceof AssistantToolValidationError) {
        return "I couldn’t resolve a valid past reporting date. Please try a date such as “1 October 2026” or a range such as “1 October to 10 October 2026”.";
      }
      throw error;
    }
  }

  const knowledge =
    request.type === AssistantRequestClassification.PRODUCT_HELP
      ? getRelevantZenvorkKnowledge(userMessage)
      : "";

  return provider.generateReply({
    messages: recentConversationContext(messages),
    systemInstruction: buildAssistantSystemInstruction({
      knowledge,
      classification: request.type,
    }),
  });
};

export { AssistantProviderConfigurationError, generateAssistantReply };
