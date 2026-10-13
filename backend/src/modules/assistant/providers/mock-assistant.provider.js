// Phase 1 provider implementation preserves existing guided replies without an external model.
const generateReply = async ({ messages }) => {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "USER");
  const question = latestUserMessage?.content?.toLowerCase() ?? "";

  if (/\b(last|previous|before|earlier|summari[sz]e).{0,60}\b(message|reply|answer|revenue|conversation|chat)\b/.test(question)) {
    const previousAssistantMessage = messages
      .slice(0, -1)
      .reverse()
      .find((message) => message.role === "ASSISTANT");
    return previousAssistantMessage?.content ?? "I can’t find that detail in the recent conversation.";
  }

  if (/revenue|earnings?|collected?|income|sales/.test(question)) {
    return "Revenue questions will be available once owner-only reporting is connected. For now, use Analytics for your current revenue summary.";
  }
  if (/reminder|appointment|draft.*message|message.*draft/.test(question)) {
    return "I can help draft a reminder. Tell me the appointment details and the tone you would like to use.";
  }
  return "I currently support guided planning, reminder drafting, and revenue-reporting guidance. Try: “What should I focus on today?”, “Draft a reminder message”, or “What was my revenue on 1 October?”";
};

const classifyRequest = async ({ message }) => {
  const isServiceManagementQuestion =
    /\b(?:add|create|update|edit|deactivate|retire|list|manage)\b.{0,30}\bservices?\b/.test(message) ||
    /\bservices?\b.{0,30}\b(?:price|duration|active|deactivate|retire)\b/.test(message);
  if (
    /\b(bookings?|appointments?|resources?|staff|payments?|reminders?|analytics|dashboard|zenvork)\b/.test(message) ||
    isServiceManagementQuestion
  ) {
    return { classification: "PRODUCT_HELP", confidence: 0.9 };
  }
  if (/\b(plan (my|the) (business )?(day|work)|what should i focus|draft.*(?:message|reply))\b/.test(message)) {
    return { classification: "BUSINESS_GUIDANCE", confidence: 0.9 };
  }
  if (/\b(what did you (?:say|tell me)|last|previous|earlier|summari[sz]e).{0,60}\b(message|reply|answer|revenue|conversation|chat)\b/.test(message)) {
    return { classification: "CONVERSATION_REFERENCE", confidence: 0.9 };
  }
  if (/\b(revenue|earnings?|income|sales|billed|collected|pending payments?)\b/.test(message)) {
    return { classification: "DATA_QUERY", confidence: 0.9 };
  }
  return { classification: "OUT_OF_SCOPE", confidence: 0.9 };
};

const formatDate = (date) => date.toISOString().slice(0, 10);

// Supports a small offline subset so the mock provider keeps the same structured-tool contract.
const extractRevenueQuery = async ({ message, currentBusinessDate }) => {
  const explicitDates = message.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  if (explicitDates.length >= 2) {
    return { fromDate: explicitDates[0], toDate: explicitDates[1] };
  }
  if (explicitDates.length === 1) {
    return { fromDate: explicitDates[0], toDate: explicitDates[0] };
  }

  const currentDate = new Date(`${currentBusinessDate}T00:00:00.000Z`);
  if (/\byesterday\b/.test(message)) {
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  }
  const date = formatDate(currentDate);
  return { fromDate: date, toDate: date };
};

export { classifyRequest, extractRevenueQuery, generateReply };
