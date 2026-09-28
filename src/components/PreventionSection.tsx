interface PreventionSectionProps {
  prevention: string[]
}

export function PreventionSection({ prevention }: PreventionSectionProps) {
  if (!prevention || prevention.length === 0) return null

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <ul className="flex flex-col gap-3">
        {prevention.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="shrink-0 w-5 h-5 rounded flex items-center justify-center bg-neutral-800 border border-neutral-700 text-neutral-500 text-xs font-semibold mt-0.5"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span className="text-sm text-neutral-300 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
