import { useState } from 'react'
import type { RegressionRisk as RegressionRiskType } from '../types/analysis'
import { generateTestCode } from '../utils/generateTests'

const RISK_STYLES = {
  high: { badge: 'text-red-400 bg-red-950/30 border-red-900', label: 'High' },
  medium: { badge: 'text-amber-400 bg-amber-950/25 border-amber-900', label: 'Medium' },
  low: { badge: 'text-green-400 bg-green-950/30 border-green-900', label: 'Low' },
}

interface RegressionRiskProps {
  regressionRisk: RegressionRiskType
  titleHint: string
}

export function RegressionRisk({ regressionRisk, titleHint }: RegressionRiskProps) {
  const [showTests, setShowTests] = useState(false)
  const [testCode, setTestCode] = useState('')
  const [testCopied, setTestCopied] = useState(false)

  const riskStyle = RISK_STYLES[regressionRisk.level] ?? RISK_STYLES.low

  const handleGenerateTests = () => {
    if (!showTests) {
      const code = generateTestCode(regressionRisk.tests, titleHint)
      setTestCode(code)
    }
    setShowTests((v) => !v)
  }

  const handleCopyTests = async () => {
    try {
      await navigator.clipboard.writeText(testCode)
      setTestCopied(true)
      setTimeout(() => setTestCopied(false), 2000)
    } catch {
      // silent fail
    }
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 flex flex-col gap-4">
      {/* Risk level header */}
      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${riskStyle.badge}`}
        >
          Risk: {riskStyle.label}
        </span>
      </div>

      {/* Reason */}
      <p className="text-sm text-neutral-400 leading-relaxed -mt-1">
        {regressionRisk.reason}
      </p>

      {/* Test scenarios */}
      {regressionRisk.tests.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2.5">
            Recommended Test Scenarios
          </p>
          <ul className="flex flex-col gap-1.5">
            {regressionRisk.tests.map((test, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                <span className="text-green-500 shrink-0 font-bold mt-0.5 text-xs" aria-hidden="true">✓</span>
                <span>{test}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generate Tests button */}
      <div>
        <button
          type="button"
          onClick={handleGenerateTests}
          className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg border border-blue-900 hover:border-blue-700 bg-blue-950/20 hover:bg-blue-950/40 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-expanded={showTests}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {showTests ? 'Hide Tests' : 'Generate Tests'}
        </button>

        {/* Generated test code */}
        {showTests && testCode && (
          <div
            className="mt-3 rounded-lg border border-neutral-700 bg-neutral-900 overflow-hidden"
            style={{ animation: 'var(--animate-slide-up)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                <span className="text-xs font-medium text-neutral-400">Generated Test Scaffold</span>
                <span className="text-xs text-neutral-600">· Vitest</span>
              </div>
              <button
                type="button"
                onClick={handleCopyTests}
                aria-label={testCopied ? 'Tests copied to clipboard' : 'Copy test code to clipboard'}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-200 px-2 py-1 rounded border border-neutral-700 hover:border-neutral-500 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {testCopied ? (
                  <span className="text-green-400">Copied!</span>
                ) : (
                  'Copy'
                )}
              </button>
            </div>
            {/* Code */}
            <pre className="overflow-x-auto p-4 font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre">
              <code>{testCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
