import { useState } from 'react'
import { Header } from './components/Header'
import { InputPanel } from './components/InputPanel'
import { AnalysisPanel } from './components/AnalysisPanel'
import { analyzeEvidence } from './services/aiService'
import type { AnalysisResult, AnalysisType } from './types/analysis'

function App() {
  const [evidence, setEvidence] = useState('')
  const [analysisType, setAnalysisType] = useState<AnalysisType>('auto')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!evidence.trim() || isLoading) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const analysis = await analyzeEvidence(evidence, analysisType)
      setResult(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setEvidence('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="h-full min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans">
      <Header />

      {/* Status announcement for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading ? 'Analyzing evidence, please wait.' : ''}
        {result && !isLoading ? `Analysis complete: ${result.title}` : ''}
        {error ? `Analysis error: ${error}` : ''}
      </div>

      {/* Main layout */}
      <main className="flex-1 flex flex-col md:grid md:grid-cols-[2fr_3fr] overflow-hidden">
        {/* Left: Input panel */}
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 overflow-y-auto">
          <InputPanel
            evidence={evidence}
            onEvidenceChange={setEvidence}
            analysisType={analysisType}
            onTypeChange={setAnalysisType}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Analysis panel */}
        <div className="flex flex-col overflow-y-auto">
          <AnalysisPanel
            result={result}
            isLoading={isLoading}
            error={error}
            onRetry={handleAnalyze}
          />
        </div>
      </main>
    </div>
  )
}

export default App
