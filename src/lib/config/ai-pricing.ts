export const AI_MODEL_PRICING = {
  'gpt-3.5-turbo': { 
    prompt: 0.0015,      // per 1K tokens
    completion: 0.002    // per 1K tokens
  },
  'gpt-4': { 
    prompt: 0.03,        // per 1K tokens
    completion: 0.06     // per 1K tokens
  },
  'gpt-4-turbo': { 
    prompt: 0.01,        // per 1K tokens
    completion: 0.03     // per 1K tokens
  },
  'claude-3-opus': {
    prompt: 0.015,       // per 1K tokens
    completion: 0.075    // per 1K tokens
  },
  'claude-3-sonnet': {
    prompt: 0.003,       // per 1K tokens
    completion: 0.015    // per 1K tokens
  }
} as const;

export type AIModel = keyof typeof AI_MODEL_PRICING;

export function getModelPricing(model: string): { prompt: number; completion: number } {
  return AI_MODEL_PRICING[model as AIModel] || AI_MODEL_PRICING['gpt-4'];
}