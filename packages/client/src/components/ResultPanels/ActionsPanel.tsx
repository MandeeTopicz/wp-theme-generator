import { useState } from 'react'
import { useIterationHistory } from '../../hooks/useIterationHistory'

interface Props {
  sessionId: string
  themeName: string
  themeSlug: string
}

export default function ActionsPanel({
  sessionId,
  themeName,
  themeSlug,
}: Props) {
  const [instruction, setInstruction] = useState('')
  const [isIterating, setIsIterating] = useState(false)
  const { history, addIteration } = useIterationHistory()

  async function handleIterate() {
    if (!instruction.trim()) return
    setIsIterating(true)
    try {
      const res = await fetch('/api/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, instruction }),
      })
      const data = await res.json()
      if (res.ok) {
        addIteration({
          instruction,
          changedFiles: (data as { changedFiles: string[] }).changedFiles ?? [],
        })
        setInstruction('')
      }
    } finally {
      setIsIterating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <h3 className="text-text1 font-semibold">{themeName}</h3>
        <p className="text-text3 text-xs font-mono">{themeSlug}</p>
      </div>

      <a
        href={`/api/download/${sessionId}`}
        className="block w-full py-3 text-white font-medium text-center rounded-xl transition-all hover:brightness-110 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-accent/50"
        style={{
          background: 'linear-gradient(135deg, #7c6fff, #ff6b9d)',
        }}
      >
        Download .zip
      </a>

      <div>
        <h4 className="text-text1 text-sm font-medium mb-3">Iterate</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
          {history.map((entry, i) => (
            <div key={i} className="bg-bg3 border border-border rounded-lg p-3">
              <p className="text-text1 text-xs">{entry.instruction}</p>
              {entry.changedFiles.length > 0 && (
                <p className="text-text3 text-[10px] mt-1">
                  Updated: {entry.changedFiles.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleIterate()
            }}
            placeholder="Describe a change..."
            className="flex-1 bg-bg3 border border-border rounded-lg px-3 py-2 text-text1 text-sm placeholder-text3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 transition-colors"
          />
          <button
            onClick={handleIterate}
            disabled={isIterating || !instruction.trim()}
            className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
          >
            {isIterating ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
