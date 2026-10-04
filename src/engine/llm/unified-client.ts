import type { LLMConfig, LLMProvider } from '../types.js';
import { callGroq, type GroqMessage, type GroqResponse } from './groq-client.js';

export interface UnifiedMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface UnifiedLLMResponse {
  content: string;
  tokensUsed?: number;
}

export interface UnifiedClientOptions {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-1.5-flash',
  openai: 'gpt-4o-mini',
};

const DEFAULT_TIMEOUT_MS = 5000;

export function buildUnifiedClientOptions(config: LLMConfig): UnifiedClientOptions {
  const provider = config.provider ?? 'groq';
  return {
    provider,
    apiKey: config.apiKey,
    model: config.model ?? DEFAULT_MODELS[provider],
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Universal LLM Call: routes seamlessly to Groq, Gemini, or OpenAI.
 */
export async function callUnifiedLLM(
  messages: UnifiedMessage[],
  options: UnifiedClientOptions,
  jsonMode = true,
): Promise<UnifiedLLMResponse> {
  switch (options.provider) {
    case 'gemini':
      return callGemini(messages, options, jsonMode);
    case 'openai':
      return callOpenAI(messages, options, jsonMode);
    case 'groq':
    default:
      return callGroqProvider(messages, options, jsonMode);
  }
}

/** Groq wrapper conforming to unified response */
async function callGroqProvider(
  messages: UnifiedMessage[],
  options: UnifiedClientOptions,
  jsonMode: boolean,
): Promise<UnifiedLLMResponse> {
  const groqMessages: GroqMessage[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const res: GroqResponse = await callGroq(groqMessages, {
    apiKey: options.apiKey,
    model: options.model,
    timeoutMs: options.timeoutMs,
  }, jsonMode);

  return {
    content: res.choices?.[0]?.message?.content ?? '',
    tokensUsed: res.usage?.total_tokens,
  };
}

/** Direct Google Gemini REST API execution */
async function callGemini(
  messages: UnifiedMessage[],
  options: UnifiedClientOptions,
  jsonMode: boolean,
): Promise<UnifiedLLMResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    // Separate system message if present
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');

    // Build Gemini contents
    const contents = nonSystemMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };

    if (systemMsg) {
      body.systemInstruction = {
        parts: [{ text: systemMsg.content }],
      };
    }

    const modelName = options.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(options.apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokensUsed = data.usageMetadata?.totalTokenCount;

    return { content, tokensUsed };
  } finally {
    clearTimeout(timer);
  }
}

/** Direct OpenAI Chat Completions API execution */
async function callOpenAI(
  messages: UnifiedMessage[],
  options: UnifiedClientOptions,
  jsonMode: boolean,
): Promise<UnifiedLLMResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 1024,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenAI API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content ?? '';
    const tokensUsed = data.usage?.total_tokens;

    return { content, tokensUsed };
  } finally {
    clearTimeout(timer);
  }
}

/** Test connectivity across any supported provider */
export async function testUnifiedConnection(options: UnifiedClientOptions): Promise<boolean> {
  try {
    const res = await callUnifiedLLM(
      [{ role: 'user', content: 'Reply with strictly JSON: {"status":"ok"}' }],
      { ...options, timeoutMs: 6000 },
      true,
    );
    return res.content.length > 0;
  } catch {
    return false;
  }
}
