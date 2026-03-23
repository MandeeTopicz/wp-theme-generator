import { useState } from 'react'

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

export function useThemeGenerator() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<GenerateError | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)

  async function generate(body: GenerateBody): Promise<GenerateResult | null> {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data as GenerateError)
        return null
      }

      const r = data as GenerateResult
      setResult(r)
      return r
    } catch {
      setError({ error: true, code: 'NETWORK_ERROR', message: 'Network error. Is the server running?' })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { generate, isLoading, error, result }
}
