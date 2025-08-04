import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AIGenerateOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  context?: Record<string, any>;
}

interface AIGenerateResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  id?: string;
}

interface UseAIReturn {
  generate: (_options: AIGenerateOptions) => Promise<AIGenerateResponse | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for AI content generation using secure backend proxy
 * This replaces any direct client-side OpenAI API usage
 */
export function useAI(): UseAIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (_options: AIGenerateOptions): Promise<AIGenerateResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(options),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || `AI generation failed: ${response.status}`);
        }

        if (!data.success) {
          throw new Error(data.error?.message || 'AI generation failed');
        }

        return data.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI content';
        setError(errorMessage);

        // Handle specific error cases
        if (errorMessage.includes('quota exceeded')) {
          toast.error(
            'AI generation quota exceeded. Please upgrade your plan or wait for the quota to reset.'
          );
        } else if (errorMessage.includes('rate limit')) {
          toast.error('Too many requests. Please wait a moment before trying again.');
        } else {
          toast.error(errorMessage);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    generate,
    loading,
    error,
  };
}

/**
 * Example usage:
 *
 * const { generate, loading } = useAI();
 *
 * const handleGenerate = async () => {
 *   const _result = await generate({
 *     prompt: 'Generate a risk assessment for data breach',
 *     systemPrompt: 'You are a risk management expert',
 *     temperature: 0.7,
 *     model: 'gpt-4'
 *   });
 *
 *   if (result) {
 *     console.log(result.content);
 *   }
 * };
 */
