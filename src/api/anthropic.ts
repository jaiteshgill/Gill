/**
 * Anthropic API Client
 */

import type { AnthropicMessage } from '../types'

const BASE_URL = 'https://api.anthropic.com/v1'
const MODEL = 'claude-sonnet-4-20250514'
const API_VERSION = '2023-06-01'

function getApiKey(): string {
  const key = localStorage.getItem('gill_anthropic_api_key') || import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) throw new Error('[anthropic] API key not set — open Settings to add one')
  return key
}

export interface CompletionOptions {
  messages: AnthropicMessage[]
  system?: string
  maxTokens?: number
  temperature?: number
}

export interface CompletionResult {
  text: string
  inputTokens: number
  outputTokens: number
}

export async function complete(options: CompletionOptions): Promise<CompletionResult> {
  const { messages, system, maxTokens = 4096, temperature = 0.7 } = options

  const response = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      ...(system ? { system } : {}),
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`[anthropic] API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.content
    ?.filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('')

  return {
    text: text ?? '',
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  }
}

export function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  return JSON.parse(cleaned) as T
}
