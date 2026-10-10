const AssistantRequestClassification = Object.freeze({
  PRODUCT_HELP: "PRODUCT_HELP",
  BUSINESS_GUIDANCE: "BUSINESS_GUIDANCE",
  UNSAFE_OR_RESTRICTED: "UNSAFE_OR_RESTRICTED",
  OUT_OF_SCOPE: "OUT_OF_SCOPE",
});

const MIN_SUPPORTED_CONFIDENCE = 0.7;

const SECRET_REQUEST_PATTERN =
  /\b(password|api[ -]?key|access token|secret key|credit card|cvv|otp)\b/;
const PROFESSIONAL_ADVICE_PATTERN =
  /\b(diagnos(?:e|is)|medication|medicine|dose|dosage|prescri(?:be|ption)|legal advice|legal action|investment advice|invest in|financial advice)\b/;
const URGENT_HEALTH_PATTERN =
  /\b(chest pain|difficulty breathing|can't breathe|cannot breathe|suicid(?:e|al)|overdose|unconscious)\b/;
const INSTRUCTION_BYPASS_PATTERN =
  /\b(ignore (?:all |any |the )?(?:previous |prior |system )?instructions|reveal (?:your |the )?(?:system )?prompt|bypass (?:your |the )?(?:rules|guardrails|safety))\b/;

const unsafeReply = (message) => {
  if (URGENT_HEALTH_PATTERN.test(message)) {
    return "I can’t provide medical advice. This may need urgent attention, so please seek immediate local medical care or contact local emergency services.";
  }

  if (SECRET_REQUEST_PATTERN.test(message)) {
    return "For your security, I can’t handle passwords, API keys, payment-card details, OTPs, or other secrets.";
  }

  if (INSTRUCTION_BYPASS_PATTERN.test(message)) {
    return "I can only help within Zenvork’s supported scope and can’t follow requests to bypass its safety rules.";
  }

  return "I can’t provide medical, legal, or financial advice. Please contact an appropriate qualified professional.";
};

const isClassification = (value) =>
  Object.values(AssistantRequestClassification).includes(value);

// Applies local safety policy first, then validates the configured provider's semantic classification.
const classifyAssistantRequest = async ({ message, classifyWithProvider }) => {
  const normalizedMessage = message.trim().toLowerCase();

  if (
    URGENT_HEALTH_PATTERN.test(normalizedMessage) ||
    SECRET_REQUEST_PATTERN.test(normalizedMessage) ||
    PROFESSIONAL_ADVICE_PATTERN.test(normalizedMessage) ||
    INSTRUCTION_BYPASS_PATTERN.test(normalizedMessage)
  ) {
    return {
      type: AssistantRequestClassification.UNSAFE_OR_RESTRICTED,
      reply: unsafeReply(normalizedMessage),
      knowledge: "",
    };
  }

  const result = await classifyWithProvider({ message: normalizedMessage });
  // console.info("Assistant request classification:", {
  //   classification: result?.classification,
  //   confidence: result?.confidence,
  // });
  if (!isClassification(result?.classification) || !Number.isFinite(result.confidence)) {
    return { type: AssistantRequestClassification.OUT_OF_SCOPE, knowledge: "" };
  }

  if (result.classification === AssistantRequestClassification.UNSAFE_OR_RESTRICTED) {
    return {
      type: AssistantRequestClassification.UNSAFE_OR_RESTRICTED,
      reply: unsafeReply(normalizedMessage),
      knowledge: "",
    };
  }

  if (
    result.confidence >= MIN_SUPPORTED_CONFIDENCE &&
    [
      AssistantRequestClassification.PRODUCT_HELP,
      AssistantRequestClassification.BUSINESS_GUIDANCE,
    ].includes(result.classification)
  ) {
    return { type: result.classification, knowledge: "" };
  }

  return { type: AssistantRequestClassification.OUT_OF_SCOPE, knowledge: "" };
};

export { AssistantRequestClassification, classifyAssistantRequest };
