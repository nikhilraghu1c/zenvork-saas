import { zenvorkFeatureCatalog } from "./zenvork-feature-catalog.js";

const MAX_KNOWLEDGE_TOPICS = 2;

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

export { getRelevantZenvorkKnowledge };
