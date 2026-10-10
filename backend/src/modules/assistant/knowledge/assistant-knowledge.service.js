import { zenvorkFeatureCatalog } from "./zenvork-feature-catalog.js";

const MAX_KNOWLEDGE_TOPICS = 2;
const BUSINESS_HELP_PATTERNS = [
  /\b(plan (my|the) (business )?(day|work)|what should i focus|business priorit(?:y|ies)|work priorit(?:y|ies))\b/,
  /\b(draft|write) (a )?(client|customer|appointment|reminder) (message|text|reply)\b/,
  /\b(running|manage|managing) (my |the )?business\b/,
];

const matchesTopic = (message, topic) =>
  topic.keywords.some((keyword) => message.includes(keyword));

// Selects a small, server-owned feature reference instead of sending the whole product catalog.
const getRelevantZenvorkKnowledge = (message) => {
  const normalizedMessage = message.toLowerCase();
  return zenvorkFeatureCatalog
    .filter((topic) => matchesTopic(normalizedMessage, topic))
    .slice(0, MAX_KNOWLEDGE_TOPICS)
    .map((topic) => topic.content)
    .join("\n\n");
};

// Allows product guidance and narrowly defined business-planning requests without calling a provider for unrelated topics.
const isAssistantScopedQuestion = (message, knowledge = getRelevantZenvorkKnowledge(message)) =>
  Boolean(knowledge) || BUSINESS_HELP_PATTERNS.some((pattern) => pattern.test(message.toLowerCase()));

export { getRelevantZenvorkKnowledge, isAssistantScopedQuestion };
