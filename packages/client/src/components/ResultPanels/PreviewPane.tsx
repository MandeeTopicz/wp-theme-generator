import { useState } from 'react'

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
}

export default function PreviewPane({
  colors,
  fontFamilies,
  templates,
  styleVariations,
  validationResult,
}: Props) {
  const [tab, setTab] = useState<'preview' | 'validation'>('preview')
  const [activeVariation, setActiveVariation] = useState('base')
  const [viewport, setViewport] = useState<375 | 768 | 1280>(1280)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-[#16213e] rounded-lg p-1">
        {(['preview', 'validation'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm rounded-md capitalize transition-colors focus:outline-none ${
              tab === t
                ? 'bg-[#e94560] text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'preview' && (
        <div className="space-y-6">
          {/* Color palette */}
          <div>
            <h4 className="text-white text-sm font-medium mb-3">
              Color Palette
            </h4>
            <div className="flex flex-wrap gap-3">
              {colors.map((c) => (
                <div key={c.slug} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10"
                    style={{ backgroundColor: c.color }}
                  />
                  <div>
                    <p className="text-white text-xs">{c.slug}</p>
                    <p className="text-white/30 text-[10px] font-mono">
                      {c.color}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <h4 className="text-white text-sm font-medium mb-3">Typography</h4>
            <div className="space-y-2 bg-[#16213e] rounded-lg p-4">
              {fontFamilies.map((f) => (
                <div key={f.slug}>
                  <p
                    className="text-white text-lg"
                    style={{ fontFamily: f.fontFamily }}
                  >
                    {f.name}
                  </p>
                  <p className="text-white/30 text-xs font-mono">
                    {f.fontFamily}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Templates wireframe */}
          <div>
            <h4 className="text-white text-sm font-medium mb-3">Templates</h4>
            <div className="grid grid-cols-3 gap-2">
              {templates.map((name) => (
                <div
                  key={name}
                  className="bg-[#16213e] rounded-lg p-3 text-center"
                >
                  <div className="h-16 bg-white/5 rounded mb-2 flex items-center justify-center">
                    <span className="text-white/20 text-xs">
                      {name.replace('.html', '')}
                    </span>
                  </div>
                  <p className="text-white/40 text-[10px] font-mono">{name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Style variations */}
          <div>
            <h4 className="text-white text-sm font-medium mb-3">
              Style Variations
            </h4>
            <div className="flex gap-2">
              {['base', ...styleVariations].map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveVariation(v)}
                  className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors focus:outline-none ${
                    activeVariation === v
                      ? 'bg-[#e94560] text-white'
                      : 'bg-[#16213e] text-white/50 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Viewport toggle */}
          <div>
            <h4 className="text-white text-sm font-medium mb-3">Viewport</h4>
            <div className="flex gap-2">
              {([375, 768, 1280] as const).map((vp) => (
                <button
                  key={vp}
                  onClick={() => setViewport(vp)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors focus:outline-none ${
                    viewport === vp
                      ? 'bg-[#e94560] text-white'
                      : 'bg-[#16213e] text-white/50 hover:text-white'
                  }`}
                >
                  {vp === 375 ? 'Mobile' : vp === 768 ? 'Tablet' : 'Desktop'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'validation' && validationResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div
            className={`p-4 rounded-lg ${
              validationResult.isValid
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                validationResult.isValid ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {validationResult.isValid
                ? 'All checks passed'
                : validationResult.summary}
            </p>
          </div>

          {/* Errors */}
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

          {/* Warnings */}
          {validationResult.warnings.map((warn, i) => (
            <div
              key={i}
              className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4"
            >
              <p className="text-amber-400 text-sm">{warn.message}</p>
              <div className="flex gap-4 mt-1 text-xs text-amber-300/50">
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
