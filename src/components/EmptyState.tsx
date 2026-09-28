// Empty state shown before any analysis
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 px-8 py-12 text-center">
      {/* Microscope icon */}
      <div className="w-14 h-14 rounded-xl border border-neutral-800 bg-neutral-900 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="14" r="11" stroke="#404040" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="5" stroke="#404040" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="1.5" fill="#525252" />
          <line x1="14" y1="3" x2="14" y2="5" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="23" x2="14" y2="25" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="14" x2="5" y2="14" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="23" y1="14" x2="25" y2="14" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div>
        <h3 className="text-neutral-400 font-semibold text-sm mb-1">
          No analysis yet
        </h3>
        <p className="text-neutral-600 text-sm max-w-xs leading-relaxed">
          Paste debugging evidence to reconstruct what happened.
        </p>
      </div>

      {/* Workflow hint */}
      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-700">
        {['Paste', 'Analyze', 'Reconstruct', 'Fix', 'Prevent'].map((step, i, arr) => (
          <span key={step} className="flex items-center gap-2">
            <span>{step}</span>
            {i < arr.length - 1 && <span aria-hidden="true">→</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
