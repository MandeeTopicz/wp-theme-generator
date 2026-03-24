import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface GenerateBody {
  description: string
  siteType: string
  targetAudience?: string
  colorMode?: string
  accentColor?: string
  themeName: string
  themeSlug: string
}

interface GenerateResult {
  sessionId: string
  manifest: Record<string, unknown>
  validationResult: Record<string, unknown>
}

interface GenerateError {
  error: true
  code: string
  message?: string
  errors?: { field: string; message: string }[]
  suggestion?: string
}

type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'

interface GenerationState {
  status: GenerationStatus
  result: GenerateResult | null
  error: GenerateError | null
  generate: (body: GenerateBody) => void
}

const GenerationContext = createContext<GenerationState | null>(null)

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<GenerateError | null>(null)

  const generate = useCallback((body: GenerateBody) => {
    setStatus('generating')
    setError(null)
    setResult(null)

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data as GenerateError)
          setStatus('error')
          return
        }
        const r = data as GenerateResult
        setResult(r)
        sessionStorage.setItem(`result-${r.sessionId}`, JSON.stringify(r))
        setStatus('complete')
      })
      .catch(() => {
        setError({
          error: true,
          code: 'NETWORK_ERROR',
          message: 'Network error. Is the server running?',
        })
        setStatus('error')
      })
  }, [])

  return (
    <GenerationContext.Provider value={{ status, result, error, generate }}>
      {children}
    </GenerationContext.Provider>
  )
}

export function useGeneration() {
  const ctx = useContext(GenerationContext)
  if (!ctx) throw new Error('useGeneration must be used within GenerationProvider')
  return ctx
}
