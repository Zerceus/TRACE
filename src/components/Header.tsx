import { isLiveAI } from '../services/aiService'

export function Header() {
  const live = isLiveAI()

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-950 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="w-7 h-7 rounded flex items-center justify-center bg-neutral-800 border border-neutral-700">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="#60a5fa" strokeWidth="1.5" />
              <circle cx="7" cy="7" r="2" fill="#60a5fa" />
              <line x1="7" y1="1" x2="7" y2="2.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="7" y1="11.5" x2="7" y2="13" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="1" y1="7" x2="2.5" y2="7" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11.5" y1="7" x2="13" y2="7" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-neutral-100 font-bold text-base tracking-wider uppercase">TRACE</span>
              <span className="text-neutral-500 text-xs font-medium">AI Debugging Microscope</span>
            </div>
          </div>
        </div>

        {/* Tagline — hidden on small screens */}
        <div className="hidden md:block h-4 w-px bg-neutral-800 mx-1" aria-hidden="true" />
        <span className="hidden md:block text-neutral-600 text-xs">
          Reconstruct the failure. Fix the cause.
        </span>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium tracking-wide uppercase ${
          live
            ? 'border-green-800 bg-green-950/50 text-green-400'
            : 'border-neutral-700 bg-neutral-900 text-neutral-400'
        }`}>
          <span
            className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-green-400' : 'bg-neutral-400'}`}
            aria-hidden="true"
          />
          {live ? 'Live AI' : 'AI Ready'}
        </div>
      </div>
    </header>
  )
}
