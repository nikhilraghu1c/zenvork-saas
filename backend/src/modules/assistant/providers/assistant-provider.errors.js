class AssistantProviderConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssistantProviderConfigurationError";
  }
}

class AssistantProviderRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssistantProviderRequestError";
  }
}

export { AssistantProviderConfigurationError, AssistantProviderRequestError };
