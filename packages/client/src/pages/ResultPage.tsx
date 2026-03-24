import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useGeneration } from '../context/GenerationContext'
import GenerationPanel from '../components/GenerationPanel/GenerationPanel'
import PlaygroundPreview from '../components/PlaygroundPreview/PlaygroundPreview'
import type { PlaygroundPreviewHandle } from '../components/PlaygroundPreview/PlaygroundPreview'
import type { IterationEntry } from '../hooks/useIterationHistory'
import { useIterationHistory } from '../hooks/useIterationHistory'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import php from 'highlight.js/lib/languages/php'
import 'highlight.js/styles/github-dark.css'

hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('php', php)

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

interface SessionData {
  manifest: ManifestData
  validationResult: ValidationResult
}

type Tab = 'live' | 'design' | 'validation'

type IterateStep = 'asking' | 'validating' | 'updating'

function loadSessionData(
  sessionId: string | undefined,
  locationState: unknown,
): SessionData | null {
  if (
    locationState &&
    typeof locationState === 'object' &&
    'manifest' in locationState
  ) {
    const state = locationState as SessionData
    if (sessionId) {
      sessionStorage.setItem(`result-${sessionId}`, JSON.stringify(state))
    }
    return state
  }
  if (sessionId) {
    const stored = sessionStorage.getItem(`result-${sessionId}`)
    if (stored) return JSON.parse(stored) as SessionData
  }
  return null
}

function getLanguage(name: string): string {
  if (name.endsWith('.json')) return 'json'
  if (name.endsWith('.html')) return 'html'
  if (name.endsWith('.css')) return 'css'
  if (name.endsWith('.php')) return 'php'
  return 'plaintext'
}

const EXT_COLORS: Record<string, string> = {
  '.html': '#7c6fff',
  '.json': '#00d9ff',
  '.css': '#ff6b9d',
  '.php': '#00e5a0',
}

function getExtColor(name: string): string {
  for (const [ext, color] of Object.entries(EXT_COLORS)) {
    if (name.endsWith(ext)) return color
  }
  return '#9090b0'
}

function getExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot) : ''
}

// --- Simple line diff ---
function computeDiff(
  oldText: string,
  newText: string,
): { type: 'same' | 'add' | 'remove'; text: string }[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: { type: 'same' | 'add' | 'remove'; text: string }[] = []

  const oldSet = new Set(oldLines)
  const newSet = new Set(newLines)

  let oi = 0
  let ni = 0
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      result.push({ type: 'same', text: oldLines[oi]! })
      oi++
      ni++
    } else if (oi < oldLines.length && !newSet.has(oldLines[oi]!)) {
      result.push({ type: 'remove', text: oldLines[oi]! })
      oi++
    } else if (ni < newLines.length && !oldSet.has(newLines[ni]!)) {
      result.push({ type: 'add', text: newLines[ni]! })
      ni++
    } else if (oi < oldLines.length) {
      result.push({ type: 'remove', text: oldLines[oi]! })
      oi++
    } else {
      result.push({ type: 'add', text: newLines[ni]! })
      ni++
    }
  }
  return result
}

// --- Code Viewer ---
function CodeViewer({
  content,
  language,
}: {
  content: string
  language: string
}) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }
  }, [content, language])

  return (
    <pre className="text-xs overflow-auto bg-bg0 rounded-lg p-4 m-0">
      <code ref={codeRef} className={`language-${language}`}>
        {content}
      </code>
    </pre>
  )
}

// --- Diff Viewer ---
function DiffViewer({ oldContent, newContent }: { oldContent: string; newContent: string }) {
  const lines = computeDiff(oldContent, newContent)
  return (
    <pre className="text-xs overflow-auto bg-bg0 rounded-lg p-4 m-0 font-mono">
      {lines.map((line, i) => (
        <div
          key={i}
          className={`px-2 -mx-2 ${
            line.type === 'add'
              ? 'bg-[#00e5a0]/10'
              : line.type === 'remove'
                ? 'bg-[#ff6b6b]/10'
                : ''
          }`}
        >
          <span
            className={`inline-block w-4 text-center mr-2 select-none ${
              line.type === 'add'
                ? 'text-[#00e5a0]'
                : line.type === 'remove'
                  ? 'text-[#ff6b6b]'
                  : 'text-text3'
            }`}
          >
            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
          </span>
          <span
            className={
              line.type === 'add'
                ? 'text-[#00e5a0]'
                : line.type === 'remove'
                  ? 'text-[#ff6b6b]'
                  : 'text-text2'
            }
          >
            {line.text}
          </span>
        </div>
      ))}
    </pre>
  )
}

interface FileEntry {
  name: string
  path: string
  content: string
}

function groupFiles(files: FileEntry[]) {
  const groups: Record<string, FileEntry[]> = {}
  for (const f of files) {
    const dir = f.path.includes('/')
      ? f.path.split('/').slice(0, -1).join('/')
      : 'root'
    if (!groups[dir]) groups[dir] = []
    groups[dir].push(f)
  }
  return groups
}

// --- Sidebar File Tree ---
function FileTree({
  files,
  selectedFile,
  changedFiles,
  onSelect,
}: {
  files: FileEntry[]
  selectedFile: string | null
  changedFiles: Set<string>
  onSelect: (file: FileEntry) => void
}) {
  const groups = groupFiles(files)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function toggle(dir: string) {
    setCollapsed((prev) => ({ ...prev, [dir]: !prev[dir] }))
  }

  return (
    <div className="space-y-1">
      {Object.entries(groups).map(([dir, entries]) => (
        <div key={dir}>
          <button
            onClick={() => toggle(dir)}
            className="w-full flex items-center gap-1.5 px-2 py-1 text-text3 text-[10px] font-mono uppercase tracking-wider hover:text-text2 transition-colors focus:outline-none"
          >
            <span className="text-[8px]">
              {collapsed[dir] ? '\u25B6' : '\u25BC'}
            </span>
            {dir}
          </button>
          {!collapsed[dir] &&
            entries.map((f) => {
              const isSelected = selectedFile === f.path
              const isChanged = changedFiles.has(f.path)
              const extColor = getExtColor(f.name)
              return (
                <button
                  key={f.path}
                  onClick={() => onSelect(f)}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-all duration-120 flex items-center gap-2 focus:outline-none ${
                    isSelected
                      ? 'bg-accent/10 text-text1 border-l-2 border-accent'
                      : 'text-text2 hover:text-text1 hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <span
                    className="text-[9px] font-mono font-bold px-1 py-0.5 rounded"
                    style={{
                      color: extColor,
                      backgroundColor: extColor + '15',
                    }}
                  >
                    {getExt(f.name)}
                  </span>
                  <span className="truncate font-mono">{f.name}</span>
                  {isChanged && (
                    <span className="w-2 h-2 rounded-full bg-[#ff9500] shrink-0 ml-auto" title="Changed in last iteration" />
                  )}
                </button>
              )
            })}
        </div>
      ))}
    </div>
  )
}

// --- Slide-over Panel with Diff/Source toggle ---
function SlideOver({
  file,
  oldContent,
  onClose,
}: {
  file: FileEntry
  oldContent: string | null
  onClose: () => void
}) {
  const [viewMode, setViewMode] = useState<'source' | 'diff'>(
    oldContent !== null ? 'diff' : 'source',
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[320px] bg-bg1 border-l border-border2 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-text1 text-sm font-mono truncate">
            {file.path}
          </span>
          <div className="flex items-center gap-2">
            {oldContent !== null && (
              <div className="flex gap-0.5 bg-bg3 rounded p-0.5">
                <button
                  onClick={() => setViewMode('diff')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors focus:outline-none ${
                    viewMode === 'diff'
                      ? 'bg-accent text-white'
                      : 'text-text3 hover:text-text2'
                  }`}
                >
                  Diff
                </button>
                <button
                  onClick={() => setViewMode('source')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors focus:outline-none ${
                    viewMode === 'source'
                      ? 'bg-accent text-white'
                      : 'text-text3 hover:text-text2'
                  }`}
                >
                  Source
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-text3 hover:text-text1 rounded hover:bg-white/10 transition-colors focus:outline-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {viewMode === 'diff' && oldContent !== null ? (
            <DiffViewer oldContent={oldContent} newContent={file.content} />
          ) : (
            <CodeViewer
              content={file.content}
              language={getLanguage(file.name)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// --- Iterate Section (sidebar) ---
const ITERATE_STEPS: { key: IterateStep; label: string }[] = [
  { key: 'asking', label: 'Asking Claude...' },
  { key: 'validating', label: 'Validating changes...' },
  { key: 'updating', label: 'Updating preview...' },
]

function IterateSection({
  sessionId,
  history,
  isIterating,
  iterateStep,
  onIterate,
}: {
  sessionId: string
  history: IterationEntry[]
  isIterating: boolean
  iterateStep: IterateStep | null
  onIterate: (instruction: string) => void
}) {
  const [instruction, setInstruction] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  function handleSubmit() {
    if (!instruction.trim() || isIterating) return
    onIterate(instruction)
    setInstruction('')
  }

  function formatTime(ts: string) {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <h4 className="text-text3 text-[10px] font-medium uppercase tracking-wider mb-2">
        Iterate
      </h4>

      {/* Iteration loading steps */}
      {isIterating && iterateStep && (
        <div className="mb-3 space-y-1.5 bg-bg3/50 rounded-lg p-2.5">
          {ITERATE_STEPS.map((step) => {
            const stepIdx = ITERATE_STEPS.findIndex((s) => s.key === iterateStep)
            const thisIdx = ITERATE_STEPS.findIndex((s) => s.key === step.key)
            const isDone = thisIdx < stepIdx
            const isActive = thisIdx === stepIdx
            return (
              <div
                key={step.key}
                className={`flex items-center gap-2 transition-opacity duration-200 ${
                  isDone ? 'opacity-40' : isActive ? 'opacity-100' : 'opacity-20'
                }`}
              >
                {isDone ? (
                  <span className="text-green text-[10px]">&#10003;</span>
                ) : isActive ? (
                  <div className="w-3 h-3 border border-border border-t-accent rounded-full animate-spin" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-text3/30" />
                )}
                <span className="text-text2 text-[11px]">{step.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto mb-2">
          {history.map((entry, i) => (
            <div key={i} className="bg-bg3/50 rounded-lg px-3 py-2">
              <div className="flex items-start justify-between gap-1">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  className="text-left flex-1 min-w-0 focus:outline-none"
                >
                  <p className="text-text1 text-[11px] leading-tight truncate">
                    {entry.instruction.length > 40
                      ? entry.instruction.slice(0, 40) + '...'
                      : entry.instruction}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-text3 text-[10px]">
                      {entry.changedFiles.length} file
                      {entry.changedFiles.length !== 1 ? 's' : ''} updated
                    </span>
                    <span className="text-text3 text-[10px]">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </button>
                <a
                  href={`/api/download/${sessionId}`}
                  title="Download this version"
                  className="shrink-0 w-6 h-6 flex items-center justify-center text-text3 hover:text-text2 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 12l-4-4h2.5V3h3v5H12L8 12zM3 14h10v-1H3v1z" />
                  </svg>
                </a>
              </div>
              {expandedIdx === i && entry.changedFiles.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-border">
                  {entry.changedFiles.map((f) => (
                    <p key={f} className="text-text3 text-[10px] font-mono truncate">
                      {f}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          disabled={isIterating}
          placeholder="Describe a change..."
          className="flex-1 min-w-0 bg-bg3 border border-border rounded-lg px-2.5 py-1.5 text-text1 text-xs placeholder-text3 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={isIterating || !instruction.trim()}
          className="px-3 py-1.5 bg-accent text-white text-xs rounded-lg hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none shrink-0"
        >
          {isIterating ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

// --- Design System Tab Content ---
function DesignSystemTab({
  colors,
  fontFamilies,
  templates,
  styleVariations,
}: {
  colors: { name: string; slug: string; color: string }[]
  fontFamilies: { name: string; slug: string; fontFamily: string }[]
  templates: string[]
  styleVariations: string[]
}) {
  const [activeVariation, setActiveVariation] = useState('base')
  const [viewport, setViewport] = useState<375 | 768 | 1280>(1280)

  return (
    <div className="space-y-6 p-6 overflow-auto">
      <div>
        <h4 className="text-text1 text-sm font-medium mb-3">Color Palette</h4>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => (
            <div key={c.slug} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-border"
                style={{ backgroundColor: c.color }}
              />
              <div>
                <p className="text-text1 text-xs">{c.slug}</p>
                <p className="text-text3 text-[10px] font-mono">{c.color}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-text1 text-sm font-medium mb-3">Typography</h4>
        <div className="space-y-2 bg-bg3 rounded-lg p-4 border border-border">
          {fontFamilies.map((f) => (
            <div key={f.slug}>
              <p className="text-text1 text-lg" style={{ fontFamily: f.fontFamily }}>
                {f.name}
              </p>
              <p className="text-text3 text-xs font-mono">{f.fontFamily}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-text1 text-sm font-medium mb-3">Templates</h4>
        <div className="grid grid-cols-3 gap-2">
          {templates.map((name) => (
            <div key={name} className="bg-bg3 border border-border rounded-lg p-3 text-center">
              <div className="h-16 bg-bg2 rounded mb-2 flex items-center justify-center">
                <span className="text-text3 text-xs">{name.replace('.html', '')}</span>
              </div>
              <p className="text-text3 text-[10px] font-mono">{name}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-text1 text-sm font-medium mb-3">Style Variations</h4>
        <div className="flex gap-2">
          {['base', ...styleVariations].map((v) => (
            <button
              key={v}
              onClick={() => setActiveVariation(v)}
              className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors focus:outline-none ${
                activeVariation === v
                  ? 'bg-accent text-white'
                  : 'bg-bg3 text-text2 hover:text-text1 border border-border'
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
                  : 'bg-bg3 text-text2 hover:text-text1 border border-border'
              }`}
            >
              {vp === 375 ? 'Mobile' : vp === 768 ? 'Tablet' : 'Desktop'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Validation Tab ---
function ValidationTab({ validationResult }: { validationResult: ValidationResult }) {
  return (
    <div className="space-y-4 p-6 overflow-auto">
      <div
        className={`p-4 rounded-lg border ${
          validationResult.isValid ? 'bg-green/5 border-green/30' : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <p className={`text-sm font-medium ${validationResult.isValid ? 'text-green' : 'text-red-400'}`}>
          {validationResult.isValid ? 'All checks passed' : validationResult.summary}
        </p>
      </div>
      {validationResult.errors.map((err, i) => (
        <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">{err.message}</p>
          <div className="flex gap-4 mt-1 text-xs text-red-300/50">
            {err.file && <span>File: {err.file}</span>}
            {err.line && <span>Line: {err.line}</span>}
            {err.block && <span>Block: {err.block}</span>}
          </div>
          {err.suggestion && (
            <p className="text-red-300/40 text-xs mt-2">Suggestion: {err.suggestion}</p>
          )}
        </div>
      ))}
      {validationResult.warnings.map((warn, i) => (
        <div key={i} className="bg-yellow/10 border border-yellow/20 rounded-lg p-4">
          <p className="text-yellow text-sm">{warn.message}</p>
          <div className="flex gap-4 mt-1 text-xs text-yellow/50">
            {warn.file && <span>File: {warn.file}</span>}
            {warn.block && <span>Block: {warn.block}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Sidebar skeletons ---
function SidebarSkeleton() {
  return (
    <div className="px-4 pt-5 space-y-4 animate-pulse">
      <div className="h-5 w-32 bg-bg3 rounded" />
      <div className="h-3 w-20 bg-bg3 rounded" />
      <div className="border-t border-border pt-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-bg3 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    </div>
  )
}

function SidebarGenerationSteps() {
  const steps = ['Designing color system...', 'Generating templates...', 'Building patterns...', 'Packaging theme...']
  return (
    <div className="px-4 pt-3 space-y-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-bg0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
            </svg>
          </div>
          <span className="text-text2 text-xs">{label}</span>
          {i === steps.length - 1 && <span className="text-green text-[10px] ml-auto">Done</span>}
        </div>
      ))}
    </div>
  )
}

// === MAIN RESULT PAGE ===
export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const generation = useGeneration()
  const playgroundRef = useRef<PlaygroundPreviewHandle>(null)

  const isPending = sessionId === 'pending'

  const [data, setData] = useState<SessionData | null>(() =>
    isPending ? null : loadSessionData(sessionId, location.state),
  )
  const [tab, setTab] = useState<Tab>('live')
  const [slideOverFile, setSlideOverFile] = useState<FileEntry | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [showContent, setShowContent] = useState(!isPending && !!data)
  const [changedFiles, setChangedFiles] = useState<Set<string>>(new Set())
  const [previousFiles, setPreviousFiles] = useState<Map<string, string>>(new Map())
  const [isIterating, setIsIterating] = useState(false)
  const [iterateStep, setIterateStep] = useState<IterateStep | null>(null)
  const { history, addIteration } = useIterationHistory()

  const handleFileSelect = useCallback((file: FileEntry) => {
    setSelectedFilePath(file.path)
    setSlideOverFile(file)
  }, [])

  // Build file list from manifest
  const manifest = data?.manifest
  const validationResult = data?.validationResult

  const allFiles: FileEntry[] = manifest
    ? [
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
    : []

  // Handle iteration
  const handleIterate = useCallback(
    async (instruction: string) => {
      if (!sessionId || sessionId === 'pending') return

      // Snapshot current files before iteration
      const snapshot = new Map<string, string>()
      for (const f of allFiles) {
        snapshot.set(f.path, f.content)
      }

      setIsIterating(true)
      setIterateStep('asking')

      try {
        const res = await fetch('/api/iterate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, instruction }),
        })
        const result = await res.json()

        if (!res.ok) return

        const { updatedManifest, changedFiles: changed, validationResult: newValidation } = result as {
          updatedManifest: ManifestData
          changedFiles: string[]
          validationResult: ValidationResult
        }

        setIterateStep('validating')
        await new Promise((r) => setTimeout(r, 300))

        // Update data
        setData({ manifest: updatedManifest, validationResult: newValidation })
        sessionStorage.setItem(
          `result-${sessionId}`,
          JSON.stringify({ manifest: updatedManifest, validationResult: newValidation }),
        )

        // Track changed files
        setPreviousFiles(snapshot)
        setChangedFiles(new Set(changed))

        addIteration({ instruction, changedFiles: changed })

        // Reload Playground
        setIterateStep('updating')
        if (playgroundRef.current) {
          await playgroundRef.current.reloadTheme()
        }
      } finally {
        setIsIterating(false)
        setIterateStep(null)
      }
    },
    [sessionId, allFiles, addIteration],
  )

  // When generation completes, pick up the result
  useEffect(() => {
    if (generation.status === 'complete' && generation.result && isPending) {
      const result = generation.result as unknown as {
        sessionId: string
        manifest: ManifestData
        validationResult: ValidationResult
      }
      setData({ manifest: result.manifest, validationResult: result.validationResult })
      navigate(`/result/${result.sessionId}`, { replace: true })
      setTimeout(() => setShowContent(true), 50)
    }
  }, [generation.status, generation.result, isPending, navigate])

  useEffect(() => {
    if (data && !showContent) {
      setShowContent(true)
    }
  }, [data, showContent])

  const isGenerating =
    isPending && (generation.status === 'generating' || generation.status === 'idle')
  const hasError = isPending && generation.status === 'error'

  if (!isPending && !data) {
    return <GenerationPanel />
  }

  const styleVariations = ['dark', 'high-contrast']
  const errorCount = validationResult ? validationResult.errors.length : 0

  // Get old content for slide-over diff
  const slideOverOldContent =
    slideOverFile && changedFiles.has(slideOverFile.path)
      ? previousFiles.get(slideOverFile.path) ?? null
      : null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'live', label: 'Live Preview' },
    { key: 'design', label: 'Design System' },
    { key: 'validation', label: 'Validation' },
  ]

  return (
    <div className="h-[calc(100vh-49px)] flex overflow-hidden">
      {/* Left sidebar */}
      <div className="w-[230px] shrink-0 bg-bg1 border-r border-border flex flex-col overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto transition-opacity duration-500 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isGenerating && <SidebarSkeleton />}

          {manifest && (
            <>
              <div className="px-4 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green animate-pulse-glow" />
                  <h3 className="text-text1 font-semibold text-sm">{manifest.name}</h3>
                </div>
                <p className="text-text3 text-[11px] font-mono mt-0.5 pl-4">{manifest.slug}</p>
              </div>

              <SidebarGenerationSteps />

              <div className="mx-4 my-3 border-t border-border" />

              <div className="px-2 pb-3">
                <FileTree
                  files={allFiles}
                  selectedFile={selectedFilePath}
                  changedFiles={changedFiles}
                  onSelect={handleFileSelect}
                />
              </div>

              <div className="mx-4 border-t border-border" />

              <div className="px-4 py-3">
                <a
                  href={`/api/download/${sessionId}`}
                  className="block w-full py-2.5 text-white text-sm font-medium text-center rounded-lg transition-all hover:brightness-110 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-accent/50"
                  style={{ background: 'linear-gradient(135deg, #7c6fff, #ff6b9d)' }}
                >
                  Download .zip
                </a>
              </div>

              <div className="mx-4 border-t border-border" />

              <div className="px-4 py-3">
                <IterateSection
                  sessionId={sessionId!}
                  history={history}
                  isIterating={isIterating}
                  iterateStep={iterateStep}
                  onIterate={handleIterate}
                />
              </div>

              <div className="mx-4 border-t border-border" />

              <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {validationResult?.isValid ? (
                    <>
                      <span className="text-green text-sm">&#10003;</span>
                      <span className="text-green/70 text-xs">All checks passed</span>
                    </>
                  ) : (
                    <>
                      <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-[10px] font-bold">
                        {errorCount}
                      </span>
                      <span className="text-red-400/70 text-xs">
                        {errorCount} error{errorCount !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0 bg-bg2 flex flex-col overflow-hidden">
        <div className="flex items-center gap-0 px-6 border-b border-border bg-bg1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              disabled={!showContent}
              className={`relative px-4 py-3 text-sm transition-colors duration-150 focus:outline-none disabled:opacity-30 ${
                tab === t.key ? 'text-text1' : 'text-text3 hover:text-text2'
              }`}
            >
              {t.key === 'live' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green mr-1.5 align-middle animate-pulse-dot" />
              )}
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden relative">
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <GenerationPanel />
            </div>
          )}

          {hasError && generation.error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-md text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-400 text-2xl font-bold">!</span>
                </div>
                <h3 className="text-text1 text-lg font-semibold mb-2">Generation Failed</h3>
                <p className="text-text2 text-sm mb-4">{generation.error.message || 'An error occurred'}</p>
                <button
                  onClick={() => navigate('/generate')}
                  className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors focus:outline-none"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {showContent && data && (
            <div className={`h-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
              {tab === 'live' && sessionId && sessionId !== 'pending' && manifest && (
                <div className="h-full">
                  <PlaygroundPreview
                    ref={playgroundRef}
                    sessionId={sessionId}
                    themeSlug={manifest.slug}
                  />
                </div>
              )}

              {tab === 'design' && manifest && (
                <DesignSystemTab
                  colors={manifest.colors ?? []}
                  fontFamilies={manifest.typography?.fontFamilies ?? []}
                  templates={manifest.templates.map((t) => t.name)}
                  styleVariations={styleVariations}
                />
              )}

              {tab === 'validation' && validationResult && (
                <ValidationTab validationResult={validationResult} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* File slide-over */}
      {slideOverFile && (
        <SlideOver
          file={slideOverFile}
          oldContent={slideOverOldContent}
          onClose={() => setSlideOverFile(null)}
        />
      )}
    </div>
  )
}
