import type { LLMConfig } from '../types.js';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT_MS = 4000;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  id: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GroqClientOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

/** Build client options from LLMConfig with defaults */
export function buildClientOptions(config: LLMConfig): GroqClientOptions {
  return {
    apiKey: config.apiKey,
    model: config.model ?? DEFAULT_MODEL,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Call the Groq Chat Completions API.
 * Uses native fetch — works in service workers and Node 18+.
 */
export async function callGroq(
  messages: GroqMessage[],
  options: GroqClientOptions,
  jsonMode = true,
): Promise<GroqResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        temperature: 0.3,
        max_tokens: 512,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new GroqApiError(
        `Groq API error ${response.status}: ${errorBody}`,
        response.status,
      );
    }

    return (await response.json()) as GroqResponse;
  } catch (err) {
    if (err instanceof GroqApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new GroqApiError('Groq API request timed out', 408);
    }
    throw new GroqApiError(
      `Groq API request failed: ${err instanceof Error ? err.message : String(err)}`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Test connectivity by sending a minimal request */
export async function testConnection(options: GroqClientOptions): Promise<boolean> {
  try {
    await callGroq(
      [{ role: 'user', content: 'Reply with exactly this JSON: {"status":"ok"}' }],
      { ...options, timeoutMs: 5000 },
      true,
    );
    return true;
  } catch {
    return false;
  }
}

export class GroqApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'GroqApiError';
  }
}
