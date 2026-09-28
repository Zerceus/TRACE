import type { AnalysisResult, AnalysisType } from '../types/analysis'
import {
  MOCK_TYPESCRIPT_ERROR,
  MOCK_SQL_ERROR,
  MOCK_API_BREAKING_CHANGE,
  MOCK_UNKNOWN,
} from './mockData'
import { validateAnalysisResult, ValidationError } from './validator'

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are TRACE, an expert software debugging analysis engine.

Your job is not merely to explain an error. Reconstruct the most likely sequence of events that caused the failure using only evidence provided by the developer.

Separate:
1. Observable symptom
2. Root cause
3. Evidence supporting the root cause
4. Execution sequence (as executionFlow steps)
5. Minimal safe fix (before/after code)
6. Regression risks
7. Prevention recommendations

Never invent code, stack frames, runtime behavior, dependencies, or facts not supported by the supplied evidence.
If evidence is insufficient, explicitly state what is unknown.
Prefer minimal, localized fixes over large rewrites.
When proposing a fix, preserve the developer's existing architecture and intent.

Return ONLY a valid JSON object matching this exact schema (no markdown fences, no extra text):
{
  "title": string,
  "category": string,
  "severity": "low" | "medium" | "high" | "critical",
  "rootCause": string,
  "symptom": string,
  "confidence": "low" | "medium" | "high",
  "evidence": string[],
  "executionFlow": [{ "label": string, "description": string, "status": "normal" | "warning" | "failure" }],
  "fix": { "before": string, "after": string, "explanation": string },
  "regressionRisk": { "level": "low" | "medium" | "high", "reason": string, "tests": string[] },
  "prevention": string[]
}`

// ─── AI Provider interface ────────────────────────────────────────────────────

interface AIProvider {
  analyze(input: string, type: AnalysisType): Promise<AnalysisResult>
}

// ─── Mock Provider ────────────────────────────────────────────────────────────

function matchMock(input: string): AnalysisResult {
  const lower = input.toLowerCase()
  if (
    lower.includes('tenantguid') ||
    lower.includes('cannot set properties of undefined') ||
    lower.includes('setting \'tenantguid\'') ||
    lower.includes("setting 'tenantguid'")
  ) {
    return MOCK_TYPESCRIPT_ERROR
  }
  if (
    lower.includes('relation') && lower.includes('does not exist') ||
    lower.includes('42p01') ||
    lower.includes('pg_catalog') ||
    (lower.includes('sql') && lower.includes('users'))
  ) {
    return MOCK_SQL_ERROR
  }
  if (
    lower.includes('user_id') && lower.includes('userid') ||
    lower.includes('breaking change') ||
    lower.includes('api breaking') ||
    (lower.includes('renamed') && lower.includes('field'))
  ) {
    return MOCK_API_BREAKING_CHANGE
  }
  return MOCK_UNKNOWN
}

class MockAIProvider implements AIProvider {
  async analyze(input: string, _type: AnalysisType): Promise<AnalysisResult> {
    // Simulate realistic network latency
    await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 400))
    return matchMock(input)
  }
}

// ─── OpenAI Provider ─────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async analyze(input: string, type: AnalysisType): Promise<AnalysisResult> {
    const userMessage = type === 'auto'
      ? `Analyze the following debugging evidence:\n\n${input}`
      : `Analyze the following ${type} debugging evidence:\n\n${input}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${err}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error(`Failed to parse AI response as JSON: ${content.slice(0, 200)}`)
    }

    return validateAnalysisResult(parsed)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

function getProvider(): AIProvider {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (apiKey && apiKey.startsWith('sk-')) {
    return new OpenAIProvider(apiKey)
  }
  return new MockAIProvider()
}

export function isLiveAI(): boolean {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  return !!(apiKey && apiKey.startsWith('sk-'))
}

export async function analyzeEvidence(
  input: string,
  type: AnalysisType,
): Promise<AnalysisResult> {
  const provider = getProvider()
  try {
    return await provider.analyze(input, type)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new Error(`Analysis response was malformed: ${error.message}`)
    }
    throw error
  }
}
