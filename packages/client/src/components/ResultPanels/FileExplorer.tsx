import { useEffect, useRef } from 'react'
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

interface FileEntry {
  name: string
  path: string
  content: string
}

interface Props {
  files: FileEntry[]
  selectedFile: string | null
  onSelect: (path: string) => void
}

function getLanguage(name: string): string {
  if (name.endsWith('.json')) return 'json'
  if (name.endsWith('.html')) return 'html'
  if (name.endsWith('.css')) return 'css'
  if (name.endsWith('.php')) return 'php'
  return 'plaintext'
}

function CodeViewer({ content, language }: { content: string; language: string }) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }
  }, [content, language])

  return (
    <pre className="text-xs overflow-auto max-h-[600px] bg-bg0 rounded-lg p-4">
      <code ref={codeRef} className={`language-${language}`}>
        {content}
      </code>
    </pre>
  )
}

export default function FileExplorer({ files, selectedFile, onSelect }: Props) {
  const groups: Record<string, FileEntry[]> = {}
  for (const f of files) {
    const dir = f.path.includes('/') ? f.path.split('/').slice(0, -1).join('/') : '/'
    if (!groups[dir]) groups[dir] = []
    groups[dir].push(f)
  }

  const selected = files.find((f) => f.path === selectedFile)

  return (
    <div className="flex gap-4 h-full">
      <div className="w-56 shrink-0 bg-bg2 rounded-xl p-3 overflow-y-auto max-h-[700px] border border-border">
        {Object.entries(groups).map(([dir, entries]) => (
          <div key={dir} className="mb-3">
            <p className="text-text3 text-xs font-mono mb-1 px-2">
              {dir === '/' ? 'root' : dir}
            </p>
            {entries.map((f) => (
              <button
                key={f.path}
                onClick={() => onSelect(f.path)}
                className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors flex justify-between items-center focus:outline-none ${
                  selectedFile === f.path
                    ? 'bg-accent/20 text-text1'
                    : 'text-text2 hover:text-text1 hover:bg-white/5'
                }`}
              >
                <span className="truncate font-mono">{f.name}</span>
                <span className="text-text3 text-[10px] ml-2 shrink-0">
                  {(new TextEncoder().encode(f.content).length / 1024).toFixed(1)}k
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        {selected ? (
          <CodeViewer
            content={selected.content}
            language={getLanguage(selected.name)}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-text3 text-sm">
            Select a file to view its content
          </div>
        )}
      </div>
    </div>
  )
}
