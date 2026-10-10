// Phase 1 provider implementation preserves existing guided replies without an external model.
const generateReply = async ({ messages }) => {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "USER");
  const question = latestUserMessage?.content?.toLowerCase() ?? "";

  if (/revenue|earnings?|collected?|income|sales/.test(question)) {
    return "Revenue questions will be available once owner-only reporting is connected. For now, use Analytics for your current revenue summary.";
  }
  if (/reminder|appointment|draft.*message|message.*draft/.test(question)) {
    return "I can help draft a reminder. Tell me the appointment details and the tone you would like to use.";
  }
  return "I currently support guided planning, reminder drafting, and revenue-reporting guidance. Try: “What should I focus on today?”, “Draft a reminder message”, or “How much revenue did I get yesterday?”";
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
  return { classification: "OUT_OF_SCOPE", confidence: 0.9 };
};

export { classifyRequest, generateReply };
