class AssistantToolAuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssistantToolAuthorizationError";
  }
}

class AssistantToolValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssistantToolValidationError";
  }
}

export { AssistantToolAuthorizationError, AssistantToolValidationError };
