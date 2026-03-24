import { useState } from 'react'
import PlaygroundPreview from '../PlaygroundPreview/PlaygroundPreview'

interface ColorEntry {
  name: string
  slug: string
  color: string
}

interface ValidationError {
  severity: string
  file?: string
  line?: number
  block?: string
  message: string
  suggestion?: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: string
}

interface Props {
  colors: ColorEntry[]
  fontFamilies: { name: string; slug: string; fontFamily: string }[]
  templates: string[]
  styleVariations: string[]
  validationResult: ValidationResult | null
  sessionId?: string
  themeSlug?: string
}

export default function PreviewPane({
  colors,
  fontFamilies,
  templates,
  styleVariations,
  validationResult,
  sessionId,
  themeSlug,
}: Props) {
  const [tab, setTab] = useState<'preview' | 'validation' | 'live'>('preview')
  const [activeVariation, setActiveVariation] = useState('base')
  const [viewport, setViewport] = useState<375 | 768 | 1280>(1280)

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-bg2 rounded-lg p-1">
        {(
          [
            { key: 'preview', label: 'Preview' },
            { key: 'validation', label: 'Validation' },
            { key: 'live', label: 'Live Preview' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm rounded-md transition-colors focus:outline-none ${
              tab === t.key
                ? 'bg-accent text-white'
                : 'text-text2 hover:text-text1'
            }`}
          >
            {t.key === 'live' && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green mr-1.5 animate-pulse-dot align-middle" />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'preview' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-text1 text-sm font-medium mb-3">
              Color Palette
            </h4>
            <div className="flex flex-wrap gap-3">
              {colors.map((c) => (
                <div key={c.slug} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-border"
                    style={{ backgroundColor: c.color }}
                  />
                  <div>
                    <p className="text-text1 text-xs">{c.slug}</p>
                    <p className="text-text3 text-[10px] font-mono">
                      {c.color}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-text1 text-sm font-medium mb-3">Typography</h4>
            <div className="space-y-2 bg-bg2 rounded-lg p-4 border border-border">
              {fontFamilies.map((f) => (
                <div key={f.slug}>
                  <p
                    className="text-text1 text-lg"
                    style={{ fontFamily: f.fontFamily }}
                  >
                    {f.name}
                  </p>
                  <p className="text-text3 text-xs font-mono">
                    {f.fontFamily}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-text1 text-sm font-medium mb-3">Templates</h4>
            <div className="grid grid-cols-3 gap-2">
              {templates.map((name) => (
                <div
                  key={name}
                  className="bg-bg2 border border-border rounded-lg p-3 text-center"
                >
                  <div className="h-16 bg-bg3 rounded mb-2 flex items-center justify-center">
                    <span className="text-text3 text-xs">
                      {name.replace('.html', '')}
                    </span>
                  </div>
                  <p className="text-text3 text-[10px] font-mono">{name}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-text1 text-sm font-medium mb-3">
              Style Variations
            </h4>
            <div className="flex gap-2">
              {['base', ...styleVariations].map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveVariation(v)}
                  className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors focus:outline-none ${
                    activeVariation === v
                      ? 'bg-accent text-white'
                      : 'bg-bg2 text-text2 hover:text-text1 border border-border'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-text1 text-sm font-medium mb-3">Viewport</h4>
            <div className="flex gap-2">
              {([375, 768, 1280] as const).map((vp) => (
                <button
                  key={vp}
                  onClick={() => setViewport(vp)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors focus:outline-none ${
                    viewport === vp
                      ? 'bg-accent3 text-bg0'
                      : 'bg-bg2 text-text2 hover:text-text1 border border-border'
                  }`}
                >
                  {vp === 375 ? 'Mobile' : vp === 768 ? 'Tablet' : 'Desktop'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'live' && sessionId && themeSlug && (
        <PlaygroundPreview sessionId={sessionId} themeSlug={themeSlug} />
      )}

      {tab === 'validation' && validationResult && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              validationResult.isValid
                ? 'bg-green/5 border-green/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                validationResult.isValid ? 'text-green' : 'text-red-400'
              }`}
            >
              {validationResult.isValid
                ? 'All checks passed'
                : validationResult.summary}
            </p>
          </div>

          {validationResult.errors.map((err, i) => (
            <div
              key={i}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
            >
              <p className="text-red-400 text-sm font-medium">{err.message}</p>
              <div className="flex gap-4 mt-1 text-xs text-red-300/50">
                {err.file && <span>File: {err.file}</span>}
                {err.line && <span>Line: {err.line}</span>}
                {err.block && <span>Block: {err.block}</span>}
              </div>
              {err.suggestion && (
                <p className="text-red-300/40 text-xs mt-2">
                  Suggestion: {err.suggestion}
                </p>
              )}
            </div>
          ))}

          {validationResult.warnings.map((warn, i) => (
            <div
              key={i}
              className="bg-yellow/10 border border-yellow/20 rounded-lg p-4"
            >
              <p className="text-yellow text-sm">{warn.message}</p>
              <div className="flex gap-4 mt-1 text-xs text-yellow/50">
                {warn.file && <span>File: {warn.file}</span>}
                {warn.block && <span>Block: {warn.block}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
