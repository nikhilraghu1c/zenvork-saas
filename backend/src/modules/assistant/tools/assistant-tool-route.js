const AssistantToolRoute = Object.freeze({
  NONE: "NONE",
  GET_REVENUE_SUMMARY: "GET_REVENUE_SUMMARY",
  UNSUPPORTED_DATA_QUERY: "UNSUPPORTED_DATA_QUERY",
});

const isAssistantToolRoute = (value) => Object.values(AssistantToolRoute).includes(value);

export { AssistantToolRoute, isAssistantToolRoute };
