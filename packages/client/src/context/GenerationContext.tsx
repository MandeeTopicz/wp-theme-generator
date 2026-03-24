import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface GenerateBody {
  description: string
  siteType: string
  targetAudience?: string
  colorMode?: string
  accentColor?: string
  themeName: string
  themeSlug: string
  colorPalette?: { name: string; colors: string[] }
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
type GenerationStep = 'design' | 'templates' | 'validating' | 'packaging' | null

interface GenerationState {
  status: GenerationStatus
  step: GenerationStep
  stepMessage: string
  result: GenerateResult | null
  error: GenerateError | null
  generate: (body: GenerateBody) => void
  reset: () => void
}

const GenerationContext = createContext<GenerationState | null>(null)

function parseSSEEvents(text: string): { event: string; data: string }[] {
  const events: { event: string; data: string }[] = []
  const blocks = text.split('\n\n')
  for (const block of blocks) {
    if (!block.trim()) continue
    let event = 'message'
    let data = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7)
      else if (line.startsWith('data: ')) data = line.slice(6)
    }
    if (data) events.push({ event, data })
  }
  return events
}

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [step, setStep] = useState<GenerationStep>(null)
  const [stepMessage, setStepMessage] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<GenerateError | null>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setStep(null)
    setStepMessage('')
    setResult(null)
    setError(null)
  }, [])

  const generate = useCallback((body: GenerateBody) => {
    setStatus('generating')
    setStep('design')
    setStepMessage('Designing color system...')
    setError(null)
    setResult(null)

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok) {
          // Non-SSE error response (validation errors return JSON)
          const data = await res.json()
          setError(data as GenerateError)
          setStatus('error')
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          setError({ error: true, code: 'STREAM_ERROR', message: 'No response stream' })
          setStatus('error')
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        let reading = true
        while (reading) {
          const { done, value } = await reader.read()
          if (done) { reading = false; break }

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE events from buffer
          const parts = buffer.split('\n\n')
          // Keep the last part as it may be incomplete
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            if (!part.trim()) continue
            const events = parseSSEEvents(part + '\n\n')
            for (const evt of events) {
              try {
                const data = JSON.parse(evt.data)
                if (evt.event === 'progress') {
                  setStep(data.step as GenerationStep)
                  setStepMessage(data.message ?? '')
                } else if (evt.event === 'complete') {
                  const r = data as GenerateResult
                  setResult(r)
                  sessionStorage.setItem(`result-${r.sessionId}`, JSON.stringify(r))
                  setStatus('complete')
                } else if (evt.event === 'error') {
                  setError(data as GenerateError)
                  setStatus('error')
                }
              } catch {
                // Skip malformed events
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const events = parseSSEEvents(buffer + '\n\n')
          for (const evt of events) {
            try {
              const data = JSON.parse(evt.data)
              if (evt.event === 'complete') {
                const r = data as GenerateResult
                setResult(r)
                sessionStorage.setItem(`result-${r.sessionId}`, JSON.stringify(r))
                setStatus('complete')
              } else if (evt.event === 'error') {
                setError(data as GenerateError)
                setStatus('error')
              }
            } catch {
              // Skip malformed events
            }
          }
        }
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
    <GenerationContext.Provider value={{ status, step, stepMessage, result, error, generate, reset }}>
      {children}
    </GenerationContext.Provider>
  )
}

export function useGeneration() {
  const ctx = useContext(GenerationContext)
  if (!ctx) throw new Error('useGeneration must be used within GenerationProvider')
  return ctx
}
