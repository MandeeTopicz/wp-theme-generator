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
      {/* Theme info */}
      <div className="bg-[#16213e] rounded-xl p-4">
        <h3 className="text-white font-semibold">{themeName}</h3>
        <p className="text-white/40 text-xs font-mono">{themeSlug}</p>
      </div>

      {/* Download */}
      <a
        href={`/api/download/${sessionId}`}
        className="block w-full py-3 bg-[#e94560] text-white font-medium text-center rounded-xl hover:bg-[#d63a54] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50"
      >
        Download .zip
      </a>

      {/* Iteration chat */}
      <div>
        <h4 className="text-white text-sm font-medium mb-3">Iterate</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
          {history.map((entry, i) => (
            <div key={i} className="bg-[#0f0f23] rounded-lg p-3">
              <p className="text-white text-xs">{entry.instruction}</p>
              {entry.changedFiles.length > 0 && (
                <p className="text-white/30 text-[10px] mt-1">
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
            className="flex-1 bg-[#0f0f23] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-transparent"
          />
          <button
            onClick={handleIterate}
            disabled={isIterating || !instruction.trim()}
            className="px-4 py-2 bg-[#e94560] text-white text-sm rounded-lg hover:bg-[#d63a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
          >
            {isIterating ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
