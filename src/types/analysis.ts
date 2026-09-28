export type AnalysisType =
  | 'auto'
  | 'error'
  | 'code'
  | 'api'
  | 'sql'
  | 'git'

export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type Confidence = 'low' | 'medium' | 'high'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface ExecutionStep {
  label: string
  description: string
  status: 'normal' | 'warning' | 'failure'
}

export interface Fix {
  before: string
  after: string
  explanation: string
}

export interface RegressionRisk {
  level: RiskLevel
  reason: string
  tests: string[]
}

export interface AnalysisResult {
  title: string
  category: string
  severity: Severity
  rootCause: string
  symptom: string
  confidence: Confidence
  evidence: string[]
  executionFlow: ExecutionStep[]
  fix: Fix
  regressionRisk: RegressionRisk
  prevention: string[]
}
