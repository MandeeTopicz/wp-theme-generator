import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import GenerationPanel from '../components/GenerationPanel/GenerationPanel'
import FileExplorer from '../components/ResultPanels/FileExplorer'
import PreviewPane from '../components/ResultPanels/PreviewPane'
import ActionsPanel from '../components/ResultPanels/ActionsPanel'

interface ThemeFile {
  name: string
  content: string
}

interface ManifestData {
  name: string
  slug: string
  templates: ThemeFile[]
  templateParts: ThemeFile[]
  patterns: ThemeFile[]
  colors?: { name: string; slug: string; color: string }[]
  typography?: {
    fontFamilies: { name: string; slug: string; fontFamily: string }[]
  }
}

interface ValidationResult {
  isValid: boolean
  errors: { severity: string; file?: string; line?: number; block?: string; message: string; suggestion?: string }[]
  warnings: { severity: string; file?: string; line?: number; block?: string; message: string; suggestion?: string }[]
  summary: string
}

interface SessionData {
  manifest: ManifestData
  validationResult: ValidationResult
}

function loadSessionData(sessionId: string | undefined, locationState: unknown): SessionData | null {
  // Try route state first (passed via navigate)
  if (locationState && typeof locationState === 'object' && 'manifest' in locationState) {
    const state = locationState as SessionData
    // Cache it for refresh
    if (sessionId) {
      sessionStorage.setItem(`result-${sessionId}`, JSON.stringify(state))
    }
    return state
  }

  // Fall back to sessionStorage
  if (sessionId) {
    const stored = sessionStorage.getItem(`result-${sessionId}`)
    if (stored) {
      return JSON.parse(stored) as SessionData
    }
  }

  return null
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const [data] = useState<SessionData | null>(() =>
    loadSessionData(sessionId, location.state),
  )
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // If no data at all, show generation panel briefly then redirect
  if (!data) {
    return <GenerationPanel />
  }

  const { manifest, validationResult } = data
  const allFiles = [
    { name: 'style.css', path: 'style.css', content: '/* Generated */' },
    { name: 'theme.json', path: 'theme.json', content: '{}' },
    ...manifest.templates.map((f) => ({
      name: f.name,
      path: `templates/${f.name}`,
      content: f.content,
    })),
    ...manifest.templateParts.map((f) => ({
      name: f.name,
      path: `parts/${f.name}`,
      content: f.content,
    })),
    ...manifest.patterns.map((f) => ({
      name: f.name,
      path: `patterns/${f.name}`,
      content: f.content,
    })),
  ]

  const styleVariations = ['dark', 'high-contrast']

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-[1fr_2fr_280px] gap-6">
        {/* Left panel — File Explorer */}
        <div>
          <h3 className="text-white text-sm font-medium mb-3">Files</h3>
          <FileExplorer
            files={allFiles}
            selectedFile={selectedFile}
            onSelect={setSelectedFile}
          />
        </div>

        {/* Center panel — Preview */}
        <div>
          <PreviewPane
            colors={manifest.colors ?? []}
            fontFamilies={manifest.typography?.fontFamilies ?? []}
            templates={manifest.templates.map((t) => t.name)}
            styleVariations={styleVariations}
            validationResult={validationResult}
          />
        </div>

        {/* Right panel — Actions */}
        <div>
          <ActionsPanel
            sessionId={sessionId!}
            themeName={manifest.name}
            themeSlug={manifest.slug}
          />
        </div>
      </div>
    </div>
  )
}
