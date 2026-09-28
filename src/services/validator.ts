import type { AnalysisResult } from '../types/analysis'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObject(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateAnalysisResult(data: unknown): AnalysisResult {
  if (!isObject(data)) {
    throw new ValidationError('Response is not an object')
  }

  const requiredStrings: (keyof AnalysisResult)[] = ['title', 'category', 'severity', 'rootCause', 'symptom', 'confidence']
  for (const key of requiredStrings) {
    if (!isString(data[key])) {
      throw new ValidationError(`Missing or invalid field: ${key}`)
    }
  }

  const validSeverities = ['low', 'medium', 'high', 'critical']
  if (!validSeverities.includes(data.severity)) {
    throw new ValidationError(`Invalid severity: ${data.severity}`)
  }

  const validConfidences = ['low', 'medium', 'high']
  if (!validConfidences.includes(data.confidence)) {
    throw new ValidationError(`Invalid confidence: ${data.confidence}`)
  }

  if (!isArray(data.evidence) || !data.evidence.every((e) => typeof e === 'string')) {
    throw new ValidationError('evidence must be a string array')
  }

  if (!isArray(data.executionFlow)) {
    throw new ValidationError('executionFlow must be an array')
  }
  for (const step of data.executionFlow) {
    if (!isObject(step) || !isString(step.label) || !isString(step.description)) {
      throw new ValidationError('Each executionFlow step must have label and description')
    }
  }

  if (!isObject(data.fix) || !isString(data.fix.before) || !isString(data.fix.after) || !isString(data.fix.explanation)) {
    throw new ValidationError('fix must have before, after, and explanation strings')
  }

  if (!isObject(data.regressionRisk) || !isString(data.regressionRisk.level) || !isString(data.regressionRisk.reason)) {
    throw new ValidationError('regressionRisk must have level and reason')
  }

  if (!isArray(data.regressionRisk.tests) || !data.regressionRisk.tests.every((t) => typeof t === 'string')) {
    throw new ValidationError('regressionRisk.tests must be a string array')
  }

  if (!isArray(data.prevention) || !data.prevention.every((p) => typeof p === 'string')) {
    throw new ValidationError('prevention must be a string array')
  }

  return data as AnalysisResult
}
