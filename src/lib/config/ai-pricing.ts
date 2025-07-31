/**
 * AI Model Pricing Configuration
 * Last Updated: July 2025
 *
 * TODO: Implement automated dynamic pricing updates via API calls to provider pricing endpoints
 *       to reduce manual maintenance and ensure accuracy
 */
export const AI_MODEL_PRICING = {
  'gpt-3.5-turbo': {
    prompt: 0.0005, // per 1K tokens (July 2025 rate)
    completion: 0.0015, // per 1K tokens (July 2025 rate)
  },
  'gpt-4': {
    prompt: 0.03, // per 1K tokens
    completion: 0.06, // per 1K tokens
  },
  'gpt-4-turbo': {
    prompt: 0.01, // per 1K tokens
    completion: 0.03, // per 1K tokens
  },
  'gpt-4o': {
    prompt: 0.005, // per 1K tokens (July 2025 rate)
    completion: 0.015, // per 1K tokens (July 2025 rate)
  },
  'gpt-4o-mini': {
    prompt: 0.00015, // per 1K tokens (July 2025 rate)
    completion: 0.0006, // per 1K tokens (July 2025 rate)
  },
  'claude-3-opus': {
    prompt: 0.015, // per 1K tokens
    completion: 0.075, // per 1K tokens
  },
  'claude-3-sonnet': {
    prompt: 0.003, // per 1K tokens
    completion: 0.015, // per 1K tokens
  },
  'claude-3.5-sonnet': {
    prompt: 0.003, // per 1K tokens (July 2025 rate)
    completion: 0.015, // per 1K tokens (July 2025 rate)
  },
} as const;

export type AIModel = keyof typeof AI_MODEL_PRICING;

/**
 * Get pricing for a specific AI model.
 *
 * @param model - The model name to get pricing for
 * @returns Pricing object with prompt and completion costs per 1K tokens
 *
 * @example
 * ```ts
 * const pricing = getModelPricing('gpt-4');
 * // Returns: { prompt: 0.03, completion: 0.06 }
 * ```
 *
 * @remarks
 * - Returns gpt-3.5-turbo pricing as fallback for unknown models (most cost-effective)
 * - Validates that the model string is not empty
 * - All prices are in USD per 1K tokens
 */
export function getModelPricing(model: string): { prompt: number; completion: number } {
  // Input validation
  if (!model || typeof model !== 'string') {
    console.warn(`Invalid model provided: ${model}. Using default pricing.`);
    return AI_MODEL_PRICING['gpt-3.5-turbo'];
  }

  // Check if model exists in pricing table
  const normalizedModel = model.trim().toLowerCase();
  const pricing = AI_MODEL_PRICING[normalizedModel as AIModel];

  if (pricing) {
    return pricing;
  }

  // Log warning for unknown model
  console.warn(`Unknown AI model: ${model}. Using gpt-3.5-turbo pricing as fallback.`);

  // Return most cost-effective model as fallback
  return AI_MODEL_PRICING['gpt-3.5-turbo'];
}
