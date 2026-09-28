import { useState } from 'react'
import type { Fix } from '../types/analysis'

interface MinimalFixProps {
  fix: Fix
}

function CodeBlock({
  code,
  label,
  variant,
  showCopy,
}: {
  code: string
  label: string
  variant: 'before' | 'after'
  showCopy?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — fail silently
    }
  }

  const borderColor = variant === 'before' ? 'border-l-red-800' : 'border-l-green-700'
  const labelColor = variant === 'before' ? 'text-red-500' : 'text-green-400'
  const bgColor = variant === 'before' ? 'bg-red-950/10' : 'bg-green-950/10'

  return (
    <div className={`relative rounded-lg border border-neutral-800 overflow-hidden border-l-2 ${borderColor} ${bgColor}`}>
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/60">
        <span className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>
          {label}
        </span>
        {showCopy && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-200 px-2 py-1 rounded border border-neutral-700 hover:border-neutral-500 bg-neutral-800/50 hover:bg-neutral-700 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {copied ? (
              <>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <rect x="1" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3 3V2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
      {/* Code */}
      <pre className="overflow-x-auto p-4 font-mono text-sm text-neutral-300 leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function MinimalFix({ fix }: MinimalFixProps) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 flex flex-col gap-4">
      {/* Before / After */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <CodeBlock code={fix.before} label="Before" variant="before" />
        <CodeBlock code={fix.after} label="After" variant="after" showCopy />
      </div>

      {/* Why this works */}
      <div className="border-t border-neutral-800 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2">
          Why this works
        </p>
        <p className="text-sm text-neutral-400 leading-relaxed">
          {fix.explanation}
        </p>
      </div>
    </div>
  )
}
