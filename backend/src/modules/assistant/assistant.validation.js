export class AssistantValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssistantValidationError";
  }
}

const ensureObject = (data, message) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AssistantValidationError(message);
  }
};

export const validateMessage = (data) => {
  ensureObject(data, "Invalid message");
  if (
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "content") ||
    typeof data.content !== "string"
  ) {
    throw new AssistantValidationError("A message is required");
  }

  const content = data.content.trim();
  if (!content) throw new AssistantValidationError("A message is required");
  if (content.length > 4000) {
    throw new AssistantValidationError(
      "A message cannot exceed 4000 characters",
    );
  }
  return content;
};

export const validateConversationTitle = (data) => {
  ensureObject(data, "Invalid conversation");
  if (
    Object.keys(data).length !== 1 ||
    !Object.hasOwn(data, "title") ||
    typeof data.title !== "string"
  ) {
    throw new AssistantValidationError("A conversation title is required");
  }

  const title = data.title.trim();
  if (!title)
    throw new AssistantValidationError("A conversation title is required");
  if (title.length > 100) {
    throw new AssistantValidationError(
      "A conversation title cannot exceed 100 characters",
    );
  }
  return title;
};
